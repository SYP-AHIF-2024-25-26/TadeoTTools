using Database.Repository;
using Database.Repository.Functions;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.MapManagement;

public static class MapValidations
{
    public static async ValueTask<object?> DoesMapPlaceExistValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var placeId = context.GetArgument<int>(1);

        if (!await dbContext.MapPlaces.AnyAsync(p => p.Id == placeId))
        {
            return Results.NotFound();
        }

        return await next(context);
    }

    /// <summary>The code is unique; a clear message instead of the generic 409.</summary>
    public static async ValueTask<object?> SaveMapPlaceValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var dto = context.Arguments.OfType<MapEndpoints.SaveMapPlaceDto>().First();
        var placeId = context.Arguments.Count == 3 ? context.GetArgument<int>(1) : 0;

        if (string.IsNullOrWhiteSpace(dto.Code))
        {
            return Results.BadRequest("The code is required.");
        }

        if (!MapFunctions.Floors.Contains(dto.Floor))
        {
            return Results.BadRequest("The floor must be U, E or 1.");
        }

        if (dto.X is < 0 or > 1 || dto.Y is < 0 or > 1)
        {
            return Results.BadRequest("The position must be on the plan.");
        }

        if (!string.IsNullOrWhiteSpace(dto.PublicLabel) && !MapFunctions.Icons.Contains(dto.Icon))
        {
            return Results.BadRequest($"A public label needs an icon: {string.Join(", ", MapFunctions.Icons)}.");
        }

        var code = dto.Code.Trim().ToLower();
        if (await dbContext.MapPlaces.AnyAsync(p => p.Id != placeId && p.Code.ToLower() == code))
        {
            return Results.Conflict($"There is already a place {dto.Code.Trim()}.");
        }

        return await next(context);
    }
}
