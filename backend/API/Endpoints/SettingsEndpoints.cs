using Database.Repository;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints;

public static class SettingsEndpoints
{
    public static void MapSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");
        group.MapGet("api/resetDB", ResetDataBase);
        group.MapGet("keyExists", ApiKeyExists);
    }

    private static Task ResetDataBase(TadeoTDbContext context)
    {
        throw new BadHttpRequestException("Not implemented yet");
    }

    private static async Task<IResult> ApiKeyExists(TadeoTDbContext context, string key)
    {
        var apiKey = await context.ApiKeys.FirstOrDefaultAsync(x => x.APIKeyValue == key);
        
        return apiKey == null ? Results.NotFound($"Apikey not valid!") : Results.Ok();
    }
}
