using API;
using API.Endpoints;
using API.Endpoints.DivisionManagement;
using API.Endpoints.StopGroupManagement;
using API.Endpoints.StopManagement;
using Database;
using Database.Repository;
using Database.Repository.Functions;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders().AddConsole();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<TadeoTDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))); //ServiceLifetime Transient

builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options => options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);

builder.Services.AddScoped<DivisionFunctions>();
builder.Services.AddScoped<StopGroupFunctions>();
builder.Services.AddScoped<StopFunctions>();
builder.Services.AddScoped<TadeoTDbContext>();


builder.Services.AddLeoAuthentication();
builder.Services.AddBasicLeoAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerWithAuth();

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: "default",
        policyBuilder =>
        {
            policyBuilder.WithOrigins("http://localhost:4200", "http://localhost:4300", "http://localhost:51566", "http://localhost:5005");
            policyBuilder.AllowAnyHeader();
            policyBuilder.AllowAnyMethod();
            policyBuilder.AllowCredentials();
        });
});

var app = builder.Build();

var environment = builder.Environment.EnvironmentName;
app.Logger.LogInformation("Running in" + environment);
app.Logger.LogInformation("Connection String:" + connectionString);

app.MapStopGroupEndpoints();
app.MapStopEndpoints();
app.MapDivisionEndpoints();
app.MapSettingsEndpoints();
app.MapUserEndpoints();

app.UseCors("default");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

var basePath = "";
if (app.Environment.IsProduction())
{
    basePath = "/tadeot-tools-backend";
    app.UsePathBase(basePath + "/");
}

app.UseCors(Setup.CorsPolicyName);

// when not using a reverse proxy (e.g. nginx) - which you should - uncomment the following line
// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

var scope = app.Services.CreateScope();
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
    } else
    {
        app.Logger.LogInformation("Database already contains data.");
    }
} catch (Exception e)
{
    app.Logger.LogError(e.Message);
}


app.Run();
