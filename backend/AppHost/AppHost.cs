var builder = DistributedApplication.CreateBuilder(args);

// PostgreSQL server and database for the application
var pgsql = builder.AddPostgres("postgres")
    .WithDataVolume();

var db = pgsql.AddDatabase("tadeot");

// API project orchestrated by Aspire
var webapi = builder.AddProject<Projects.API>("api")
    // Map the database connection into API's ConnectionStrings:DefaultConnection
    .WithReference(db, connectionName: "DefaultConnection")
    // Make HTTP endpoints accessible from host machine
    .WithExternalHttpEndpoints();

var dashboard = builder.AddNpmApp("dashboard", "../../dashboard")
    .WithReference(webapi)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

var guideapp = builder.AddNpmApp("frontend", "../../frontend")
    .WithReference(webapi)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

builder.Build().Run();
