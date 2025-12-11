using Database.Repository;
using Database.Repository.Functions;

namespace API.Endpoints.DivisionManagement;

public static class DivisionManagementValidations
{
    public static async ValueTask<object?> CreateDivisionValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var division = context.GetArgument<DivisionManagementEndpoints.AddDivisionDto>(1);

        if (dbContext.Divisions.Any(d => d.Name == division.Name))
        {
            return Results.BadRequest("Division name already exists.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> UpdateDivisionValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var dto = context.GetArgument<DivisionManagementEndpoints.UpdateDivisionDto>(1);

        var division = await dbContext.Divisions.FindAsync(dto.Id);

        if (division == null)
        {
            return Results.NotFound();
        }

        if (dbContext.Divisions.Any(d => d.Name == dto.Name && d.Id != dto.Id))
        {
            return Results.BadRequest("Division name already exists.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> UpdateDivisionImageValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var dto = context.GetArgument<DivisionManagementEndpoints.UpdateDivisionImageDto>(1);

        if (!await DivisionFunctions.DoesDivisionExistAsync(dbContext, dto.Id))
        {
            return Results.NotFound();
        }

        return await next(context);
    }

    public static async ValueTask<object?> DoesDivisionExistValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var divisionId = context.GetArgument<int>(1);

        if (!await DivisionFunctions.DoesDivisionExistAsync(dbContext, divisionId))
        {
            return Results.NotFound();
        }

        return await next(context);
    }
}