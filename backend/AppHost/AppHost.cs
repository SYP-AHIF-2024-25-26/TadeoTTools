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

// The dashboard's preview page shows the guide in a frame.
dashboard.WithEnvironment("GUIDE_URL", guideapp.GetEndpoint("http"));

var feedbackKiosk = builder.AddJavaScriptApp("kiosk-feedback", "../../kiosk/feedback")
    .WithReference(webapi)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints()
    .WithBuildScript("start")
    .WithRunScript("start");

// Registers visitors through webapi, without a login.
var registrationKiosk = builder.AddJavaScriptApp("kiosk-registration", "../../kiosk/registration")
    .WithReference(webapi)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints()
    .WithBuildScript("start")
    .WithRunScript("start");

// Sells through webapi (with the school login); every completed sale is a real one.
var cashierKiosk = builder.AddJavaScriptApp("kiosk-cashier", "../../kiosk/cashier")
    .WithReference(webapi)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints()
    .WithBuildScript("start")
    .WithRunScript("start");

// Reads the visitor statistics from webapi (GET only).
var statisticsKiosk = builder.AddJavaScriptApp("kiosk-statistics", "../../kiosk/statistics")
    .WithReference(webapi)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints()
    .WithBuildScript("start")
    .WithRunScript("start");

webapi
    .WithEnvironment("AllowedOrigins__0", dashboard.GetEndpoint("http"))
    .WithEnvironment("AllowedOrigins__1", guideapp.GetEndpoint("http"))
    .WithEnvironment("AllowedOrigins__2", feedbackKiosk.GetEndpoint("http"))
    .WithEnvironment("AllowedOrigins__3", cashierKiosk.GetEndpoint("http"))
    .WithEnvironment("AllowedOrigins__4", registrationKiosk.GetEndpoint("http"))
    .WithEnvironment("AllowedOrigins__5", statisticsKiosk.GetEndpoint("http"));

builder.Build().Run();
