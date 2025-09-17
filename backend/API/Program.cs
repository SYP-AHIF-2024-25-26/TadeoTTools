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
using API.Endpoints.TeacherManagement;
using API.Endpoints.AdminManagement;
using API.Endpoints.FeedbackManagement;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders().AddConsole();

Thread.Sleep(3000);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<TadeoTDbContext>(options =>
    options.UseMySQL(connectionString!)); // ServiceLifetime Transient

builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options => options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);
builder.Services.AddProblemDetails();

builder.Services.AddScoped<DivisionFunctions>();
builder.Services.AddScoped<StopGroupFunctions>();
builder.Services.AddScoped<StopFunctions>();
builder.Services.AddScoped<TadeoTDbContext>();

builder.Services.AddLeoAuthentication();
builder.Services.AddBasicAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerWithAuth();

builder.Services.AddCors(options =>
{
    options.AddPolicy(Setup.CorsPolicyName,
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
app.MapStudentEndpoints();
app.MapDivisionEndpoints();
app.MapTeacherEndpoints();
app.MapSettingsEndpoints();
app.MapUserEndpoints();
app.MapAdminEndpoints();
app.MapFeedbackEndpoints();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.Map("ping", () => Results.Ok("pong"));

app.UseCors(Setup.CorsPolicyName);

app.UseAuthentication();
app.UseAuthorization();

var scope = app.Services.CreateScope();
var context = scope.ServiceProvider.GetService<TadeoTDbContext>();

try
{
    app.Logger.LogInformation("Ensure database is created...");
    await context!.Database.EnsureCreatedAsync();
    if (!await context.Divisions.AnyAsync())
    {
        app.Logger.LogInformation("Importing data ...");
        await CsvImporter.ImportCsvFileAsync("TdoT_Stationsplanung_2025.csv", context);
    } else
    {
        app.Logger.LogInformation("Database already contains data.");
    }

    if (!await context.Students.AnyAsync())
    {
        app.Logger.LogInformation("Importing Students data ...");
        // Students.csv just for testing purposes right now
        await CsvImporter.ImportStudentsAsync("Students.csv", context);
    }

    if (!await context.Teachers.AnyAsync())
    {
        app.Logger.LogInformation("Importing Teachers data ...");
        // Teachers.csv just for testing purposes right now
        await CsvImporter.ImportTeachersAsync("Teachers.csv", context);
    }
} catch (Exception e)
{
    app.Logger.LogError(e.Message);
}

app.Run();
