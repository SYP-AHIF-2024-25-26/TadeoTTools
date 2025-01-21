using Database;
using Database.Entities;
using Database.Repository;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace API.Endpoints;

public static class SettingsEndpoints
{
    public static void MapSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");
        group.MapGet("api/resetDB", ResetDataBase);
        group.MapGet("keyExists", ApiKeyExists);
    }

    public static async Task ResetDataBase(TadeoTDbContext context)
    {
        new BadHttpRequestException("Not implemented yet");
    }
    
    public static async Task<IResult> ApiKeyExists(TadeoTDbContext context, string key)
    {
        var apiKey = await context.APIKeys.FirstOrDefaultAsync(x => x.APIKeyValue == key);
        if (apiKey == null)
        {
            return Results.NotFound($"Apikey not valid!");
        }
        return Results.Ok();
    }
}
