using API;
using API.Endpoints;
using API.Endpoints.DivisionManagement;
using API.Endpoints.StopGroupManagement;
using API.Endpoints.StopManagement;
using API.Endpoints.StudentManagement;
using API.Endpoints.UserManagement;
using Database;
using Database.Repository;
using Database.Repository.Functions;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using API.Endpoints.StopManagerManagement;
using API.Endpoints.AdminManagement;
using API.Endpoints.FeedbackManagement;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders().AddConsole();

Thread.Sleep(3000);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<TadeoTDbContext>(options =>
    options.UseNpgsql(connectionString!)); // ServiceLifetime Transient

builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddValidation();

builder.Services.AddScoped<DivisionFunctions>();
builder.Services.AddScoped<StopGroupFunctions>();
builder.Services.AddScoped<StopFunctions>();
builder.Services.AddScoped<TadeoTDbContext>();

builder.Services.AddLeoAuthentication();
builder.Services.AddBasicAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerWithAuth();

var dynamicOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? [];

dynamicOrigins = dynamicOrigins
    .Select(o => o.TrimEnd('/'))
    .Where(o => !string.IsNullOrWhiteSpace(o))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

var staticOrigins = new[]
{
    "https://tadeot.htl-leonding.ac.at",
    "http://localhost:4200",
    "http://localhost:4300",
    "http://localhost:5005"
};

var allOrigins = staticOrigins
    .Concat(dynamicOrigins)
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

Console.WriteLine($"Allowed Origins: {string.Join(", ", allOrigins)}");

builder.Services.AddCors(options =>
{
    options.AddPolicy(Setup.CorsPolicyName,
        policyBuilder =>
        {
            if (builder.Environment.IsDevelopment())
            {
                policyBuilder.AllowAnyOrigin();
            }
            else
            {
                policyBuilder.WithOrigins(allOrigins);
            }
            policyBuilder.AllowAnyHeader();
            policyBuilder.AllowAnyMethod();
        });
});

var app = builder.Build();

var environment = builder.Environment.EnvironmentName;
app.Logger.LogInformation("Running in" + environment);
app.Logger.LogInformation("Connection String:" + connectionString);

app.UseCors(Setup.CorsPolicyName);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler();

app.UseAuthentication();
app.UseAuthorization();

app.Map("ping", () => Results.Ok("pong"));

// Map endpoints after middleware so CORS applies to them
app.MapStopGroupEndpoints();
app.MapStopEndpoints();
app.MapStudentEndpoints();
app.MapDivisionEndpoints();
app.MapStopManagerEndpoints();
app.MapSettingsEndpoints();
app.MapUserEndpoints();
app.MapAdminEndpoints();
app.MapFeedbackEndpoints();

var scope = app.Services.CreateScope();
var context = scope.ServiceProvider.GetService<TadeoTDbContext>();

try
{
    app.Logger.LogInformation("Ensure Migrations are applied and Database is created...");
    await context!.Database.MigrateAsync();

    // Seed initial admin if configured
    //await SeedInitialAdminAsync(context, app.Logger, builder.Configuration);

    if (!await context.Students.AnyAsync())
    {
        app.Logger.LogInformation("Importing Students data ...");
        // Students.csv just for testing purposes right now
        await CsvImporter.ImportStudentsAsync("Students.csv", context);
    }

    if (!await context.StopManagers.AnyAsync())
    {
        app.Logger.LogInformation("Importing StopManager data ...");
        // Teachers.csv just for testing purposes right now
        await CsvImporter.ImportStopManagersAsync("Teachers.csv", context);
    }

    if (!await context.Divisions.AnyAsync())
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

app.Run();
/*
static async Task SeedInitialAdminAsync(
    TadeoTDbContext context, 
    ILogger logger, 
    IConfiguration configuration)
{
    var adminId = configuration.GetValue<string>("SeedData:InitialAdminId");
    
    if (string.IsNullOrWhiteSpace(adminId))
    {
        logger.LogWarning(
            "No initial admin ID configured in appsettings. " +
            "To seed an admin, set 'SeedData:InitialAdminId' in appsettings.Local.json");
        return;
    }

    if (await context.Admins.AnyAsync(a => a.Id == adminId))
    {
        logger.LogInformation("Admin '{AdminId}' already exists in database", adminId);
        return;
    }

    logger.LogInformation("Seeding initial admin: {AdminId}", adminId);
    await context.Admins.AddAsync(new Database.Entities.Admin { Id = adminId });
    await context.SaveChangesAsync();
    logger.LogInformation("Admin seeded successfully");
}*/
public partial class Program { }