using Database.Repository;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.CityManagement;

public static class CityValidations
{
    public static async ValueTask<object?> DoesDistrictExistValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var districtId = context.GetArgument<int>(1);

        if (!await dbContext.Districts.AnyAsync(d => d.Id == districtId))
        {
            return Results.NotFound();
        }

        return await next(context);
    }

    /// <summary>Number and name are unique; a clear message instead of the generic 409.</summary>
    public static async ValueTask<object?> SaveDistrictValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var dto = context.Arguments.OfType<CityEndpoints.SaveDistrictDto>().First();
        var districtId = context.Arguments.Count == 3 ? context.GetArgument<int>(1) : 0;

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return Results.BadRequest("The name is required.");
        }

        var name = dto.Name.Trim().ToLower();
        if (await dbContext.Districts.AnyAsync(d => d.Id != districtId && d.Number == dto.Number))
        {
            return Results.Conflict($"There is already a district with number {dto.Number}.");
        }

        if (await dbContext.Districts.AnyAsync(d => d.Id != districtId && d.Name.ToLower() == name))
        {
            return Results.Conflict($"There is already a district named {dto.Name.Trim()}.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> DeleteDistrictValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var districtId = context.GetArgument<int>(1);

        var cityCount = await dbContext.Cities.CountAsync(c => c.DistrictId == districtId);
        if (cityCount > 0)
        {
            return Results.Conflict(
                $"{cityCount} {(cityCount == 1 ? "town belongs" : "towns belong")} to this district. Move them to another district first.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> DoesCityExistValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var cityId = context.GetArgument<int>(1);

        if (!await dbContext.Cities.AnyAsync(c => c.Id == cityId))
        {
            return Results.NotFound();
        }

        return await next(context);
    }

    public static async ValueTask<object?> SaveCityValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var dto = context.Arguments.OfType<CityEndpoints.SaveCityDto>().First();
        var cityId = context.Arguments.Count == 3 ? context.GetArgument<int>(1) : 0;

        var zipCode = dto.ZipCode.Trim();
        if (!CityEndpoints.IsZipCode(zipCode))
        {
            return Results.BadRequest("The postcode must have four digits.");
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return Results.BadRequest("The name is required.");
        }

        if (!await dbContext.Districts.AnyAsync(d => d.Id == dto.DistrictId))
        {
            return Results.BadRequest("The district does not exist.");
        }

        var name = dto.Name.Trim().ToLower();
        if (await dbContext.Cities.AnyAsync(c => c.Id != cityId && c.ZipCode == zipCode && c.Name.ToLower() == name))
        {
            return Results.Conflict($"{zipCode} {dto.Name.Trim()} already exists.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> DeleteCityValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var cityId = context.GetArgument<int>(1);

        var visitorCount = await dbContext.Visitors.CountAsync(v => v.CityId == cityId);
        if (visitorCount > 0)
        {
            return Results.Conflict(
                $"{visitorCount} {(visitorCount == 1 ? "registration comes" : "registrations come")} from this town. Rename it instead of deleting it.");
        }

        return await next(context);
    }
}
