using System.Text.Json.Serialization;
using API.Endpoints;
using API.Middleware;
using Microsoft.EntityFrameworkCore;
using Database.Repository;
using Database.Repository.Functions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<TadeoTDbContext>(options =>
    options.UseMySql(TadeoTDbContextFactory.GetConnectionString(),
                        ServerVersion.AutoDetect(TadeoTDbContextFactory.GetConnectionString()))); //ServiceLifetime Transient

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
            policyBuilder.WithOrigins("http://localhost:4200", "http://localhost:4300");
            policyBuilder.AllowAnyHeader();
            policyBuilder.AllowAnyMethod();
            policyBuilder.AllowCredentials();
        });
});

var app = builder.Build();

app.UseCors("default");

app.MapStopGroupEndpoints();
app.MapStopEndpoints();
app.MapDivisionEndpoints();
app.MapSettingsEndpoints();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseMiddleware<ApiKeyMiddleware>();

app.Run();