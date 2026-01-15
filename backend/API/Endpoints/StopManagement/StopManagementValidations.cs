using Database.Repository;
using Database.Repository.Functions;

namespace API.Endpoints.StopManagement;

public static class StopManagementValidations
{
    public static async ValueTask<object?> CreateStopValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var createStopDto = context.GetArgument<StopManagementEndpoints.CreateStopRequestDto>(1);

        foreach (var divisionId in createStopDto.DivisionIds)
        {
            var division = await dbContext.Divisions.FindAsync(divisionId);
            if (division == null)
            {
                return Results.NotFound($"Division with ID {divisionId} not found");
            }
        }

        return await next(context);
    }

    public static async ValueTask<object?> DeleteStopValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var stopId = context.GetArgument<int>(1);

        if (!await StopFunctions.DoesStopExistAsync(dbContext, stopId))
        {
            return Results.NotFound($"Stop with ID {stopId} not found");
        }

        return await next(context);
    }
}