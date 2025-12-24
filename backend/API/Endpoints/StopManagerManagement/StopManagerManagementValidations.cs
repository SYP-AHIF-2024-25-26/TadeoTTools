using Database.Repository;
using Database.Repository.Functions;

namespace API.Endpoints.StopManagerManagement;

public static class StopManagerManagementValidations
{
    public static async ValueTask<object?> GetStopManagerByIdValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var stopManagerId = context.GetArgument<string>(1);

        if (string.IsNullOrWhiteSpace(stopManagerId))
        {
            return Results.BadRequest("StopManager ID is required.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> DeleteStopManagerValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var stopManagerId = context.GetArgument<string>(1);

        if (string.IsNullOrWhiteSpace(stopManagerId))
        {
            return Results.BadRequest("StopManager ID is required.");
        }

        var stopManagerExists = await dbContext.StopManagers.FindAsync(stopManagerId);
        if (stopManagerExists == null)
        {
            return Results.NotFound($"StopManager with ID {stopManagerId} not found.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> UploadCsvFileValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var file = context.GetArgument<StopManagerManagementEndpoints.UploadStopManagerCsvFileDto>(0);

        if (file.File.Length == 0)
        {
            return Results.BadRequest("File cannot be empty.");
        }

        if (!file.File.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
        {
            return Results.BadRequest("File must be a CSV file.");
        }

        return await next(context);
    }
}

