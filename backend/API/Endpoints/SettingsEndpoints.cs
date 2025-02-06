using Database.Repository;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints;

public static class SettingsEndpoints
{
    public static void MapSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");
        group.MapGet("api/resetDB", ResetDataBase);
    }

    private static Task ResetDataBase(TadeoTDbContext context)
    {
        throw new BadHttpRequestException("Not implemented yet");
    }
}
