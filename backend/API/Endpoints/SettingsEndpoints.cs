namespace API.Endpoints;

public static class SettingsEndpoints
{
    public static void MapSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1/api");
        group.MapGet("resetDB", ResetDataBase);
    }

    public static void ResetDataBase()
    {
        ImportConsoleApp.Program.Main(["isAPI"]);
    }
    
    
    
    
}