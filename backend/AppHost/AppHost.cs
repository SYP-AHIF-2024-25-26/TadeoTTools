var builder = DistributedApplication.CreateBuilder(args);

// PostgreSQL server and database for the application
var pgsql = builder.AddPostgres("postgres")
    .WithDataVolume();

var db = pgsql.AddDatabase("tadeot");

// API project orchestrated by Aspire
var webapi = builder.AddProject<Projects.API>("api")
    .WithReference(db, connectionName: "DefaultConnection")
    .WithExternalHttpEndpoints();

var dashboard = builder.AddJavaScriptApp("dashboard", "../../dashboard")
    .WithReference(webapi)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

var guideapp = builder.AddJavaScriptApp("frontend", "../../frontend")
    .WithReference(webapi)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

builder.Build().Run();
