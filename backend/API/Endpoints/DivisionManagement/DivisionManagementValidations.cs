using Database.Repository;
using Database.Repository.Functions;

namespace API.Endpoints.DivisionManagement;

public static class DivisionManagementValidations
{
    public static async ValueTask<object?> CreateDivisionValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var name = context.GetArgument<string>(1);
        var color = context.GetArgument<string>(2);
        
        if (name.Length > 255)
        {
            return Results.BadRequest("Division name must be less than 255 characters.");
        }

        if (color.Length > 7)
        {
            return Results.BadRequest("Color must be less than 8 characters.");
        }

        if (dbContext.Divisions.Any(d => d.Name == name))
        {
            return Results.BadRequest("Divisionname already exists.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> UpdateDivisionValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var dto = context.GetArgument<DivisionManagementEndpoints.UpdateDivisionDto>(1);
        
        if (dto.Name.Length > 255)
        {
            return Results.BadRequest("Division name must be less than 255 characters.");
        }

        if (dto.Color.Length > 7)
        {
            return Results.BadRequest("Color must be less than 8 characters.");
        }
        
        var division = await dbContext.Divisions.FindAsync(dto.Id);
        
        if (division == null)
        {
            return Results.NotFound();
        }

        if (dbContext.Divisions.Any(d => d.Name == dto.Name))
        {
            return Results.BadRequest("Divisionname already exists.");
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