var builder = DistributedApplication.CreateBuilder(args);

// PostgreSQL server and database for the application
/*
var pgsql = builder.AddPostgres("postgres")
    .WithDataVolume();
*/

// API project orchestrated by Aspire
// API project orchestrated by Aspire
var webapi = builder.AddProject<Projects.API>("api")
    .WithExternalHttpEndpoints();

var dashboard = builder.AddJavaScriptApp("dashboard", "../../dashboard")
    .WithReference(webapi)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints()
    .WithBuildScript("start")
    .WithRunScript("start");

var guideapp = builder.AddJavaScriptApp("frontend", "../../frontend")
    .WithReference(webapi)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints()
    .WithBuildScript("start")
    .WithRunScript("start");

webapi
    .WithEnvironment("AllowedOrigins__0", dashboard.GetEndpoint("http"))
    .WithEnvironment("AllowedOrigins__1", guideapp.GetEndpoint("http"));

builder.Build().Run();
