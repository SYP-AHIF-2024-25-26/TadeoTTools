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

var guideapp = builder.AddJavaScriptApp("guide", "../../guide")
    .WithReference(webapi)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints()
    .WithBuildScript("start")
    .WithRunScript("start");

var feedbackKiosk = builder.AddJavaScriptApp("kiosk-feedback", "../../kiosk/feedback")
    .WithReference(webapi)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints()
    .WithBuildScript("start")
    .WithRunScript("start");

// Talks to the legacy TadeoT backend (not part of this repository), not to webapi.
builder.AddJavaScriptApp("kiosk-registration", "../../kiosk/registration")
    .WithEnvironment("REGISTRATION_API_URL", "https://tadeot.htl-leonding.ac.at/tadeot-api")
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints()
    .WithBuildScript("start")
    .WithRunScript("start");

webapi
    .WithEnvironment("AllowedOrigins__0", dashboard.GetEndpoint("http"))
    .WithEnvironment("AllowedOrigins__1", guideapp.GetEndpoint("http"))
    .WithEnvironment("AllowedOrigins__2", feedbackKiosk.GetEndpoint("http"));

builder.Build().Run();
