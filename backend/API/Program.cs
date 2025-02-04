using API.Endpoints;
using API.Middleware;
using Database;
using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using System.Text.Json.Serialization;
using API.Endpoints.DivisionManagement;
using API.Endpoints.StopGroupManagement;
using API.Endpoints.StopManagement;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders().AddConsole();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<TadeoTDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))); //ServiceLifetime Transient

builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options => options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);

builder.Services.AddScoped<DivisionFunctions>();
builder.Services.AddScoped<APIKeyFunctions>();
builder.Services.AddScoped<StopGroupFunctions>();
builder.Services.AddScoped<StopFunctions>();
builder.Services.AddScoped<TadeoTDbContext>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: "default",
        policyBuilder =>
        {
            policyBuilder.WithOrigins("http://localhost:4200", "http://localhost:4300", "http://localhost:51566");
            policyBuilder.AllowAnyHeader();
            policyBuilder.AllowAnyMethod();
            policyBuilder.AllowCredentials();
        });
});

var app = builder.Build();

var environment = builder.Environment.EnvironmentName;
app.Logger.LogInformation("Running in {Environment} environment", environment);
app.Logger.LogInformation($"Connection String: {connectionString}");

app.UseCors("default");

app.MapStopGroupEndpoints();
app.MapStopEndpoints();
app.MapDivisionEndpoints();
app.MapSettingsEndpoints();

var basePath = "";
if (app.Environment.IsProduction())
{
    basePath = "/tadeot-tools-backend";
    app.UsePathBase(basePath + "/");
}

app.UseSwagger(options =>
{
    // Workaround to use the Swagger UI "Try Out" functionality when deployed behind a reverse proxy
    options.PreSerializeFilters.Add((swagger, httpReq) =>
    {
        // modify try-out url only in case of proxy forwarding to this service
        if (httpReq.Headers.ContainsKey("X-Forwarded-Host"))
        {
            // httpReq.Headers["X-Forwarded-Host"] and httpReq.Headers["X-Forwarded-Prefix"] is what we need to get the base path.
            // Since we have the forwarded prefix already in the basePath var, we can also use this
            // TODO: Use this httpRequest property instead of hard-coded basePath

            var serverUrl = $"https://{httpReq.Headers["X-Forwarded-Host"]}{basePath}";
            swagger.Servers = new List<OpenApiServer> { new OpenApiServer { Url = serverUrl } };
        }
    });
});

app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint($"{basePath}/swagger/v1/swagger.json", "Api v1");
});

/* Comment next line for No API-Key-Validation*/
//app.UseMiddleware<ApiKeyMiddleware>();

var scope = app.Services.CreateScope();

var apiKeyFunctions = scope.ServiceProvider.GetService<APIKeyFunctions>();
var context = scope.ServiceProvider.GetService<TadeoTDbContext>();

try
{
    app.Logger.LogInformation("Ensure database is created...");
    await context!.Database.EnsureCreatedAsync();
    var divisions = await context.Divisions.CountAsync();
    if (divisions == 0)
    {
        app.Logger.LogInformation("Importing data ...");
        await CsvImporter.ImportCsvFileAsync("TdoT_Stationsplanung_2025.csv", context);
    }
    else
    {
        app.Logger.LogInformation("Database already contains data.");
    }
}
catch (Exception e)
{
    app.Logger.LogError(e.Message);
}

if (apiKeyFunctions is null)
{
    app.Logger.LogError("APIKeyFunctions is null");
}
else
{
    if ((await apiKeyFunctions.GetAllAPIKeys()).Count <= 0)
    {
        app.Logger.LogInformation("No API key found in database - generating a new one.");
        var key = new APIKey { APIKeyValue = APIKeyGenerator.GenerateApiKey() };
        await apiKeyFunctions.AddAPIKey(key);
        app.Logger.LogInformation("Generated API key: {Key}", key.APIKeyValue);
    }
}


app.Run();