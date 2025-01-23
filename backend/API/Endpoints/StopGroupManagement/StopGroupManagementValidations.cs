using Database.Repository;
using Database.Repository.Functions;

namespace API.Endpoints.StopGroupManagement;

public static class StopGroupManagementValidations
{
    public static async ValueTask<object?> DeleteGroupValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var groups = context.GetArgument<StopGroupFunctions>(1);
        var groupId = context.GetArgument<int>(2);
        
        if (!await groups.DoesStopGroupExistAsync(dbContext, groupId))
        {
            return Results.NotFound();
        }
        
        return await next(context);
    }
}