using Database;
using Database.Repository;
using System.IO;

namespace API.Endpoints;

public static class SettingsEndpoints
{
    public static void MapSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1/api");
        group.MapGet("resetDB", ResetDataBase);
    }

    public static async Task ResetDataBase(TadeoTDbContext context)
    {
        new BadHttpRequestException("Not implemented yet");
    }
    
    
    
    
}