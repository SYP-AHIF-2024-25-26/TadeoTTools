using Database.Repository.Functions;

using API.Endpoints.StopManagerManagement;

namespace API.Endpoints.StopManagerManagement;

public static class StopManagerManagementApi
{
    public static void MapStopManagerEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");
        group.MapGet("api/stopmanagers", StopManagerManagementEndpoints.GetAllStopManagers)
            .WithName(nameof(StopManagerManagementEndpoints.GetAllStopManagers))
            .WithDescription("Get all stop managers")
            .Produces<List<StopManagerFunctions.StopManagerWithStopsDto>>();

        group.MapGet("api/stopmanagers/{id}", StopManagerManagementEndpoints.GetStopManagerById)
            .AddEndpointFilter(StopManagerManagementValidations.GetStopManagerByIdValidationAsync)
            .WithName(nameof(StopManagerManagementEndpoints.GetStopManagerById))
            .WithDescription("Get a stop manager by id")
            .Produces<StopManagerFunctions.StopManagerWithStopsDto>()
            .Produces(StatusCodes.Status400BadRequest)
            .RequireAuthorization(Setup.StopManagerOrAdminPolicyName);

        group.MapPost("api/stopmanagers", StopManagerManagementEndpoints.AddStopManager)
            .WithName(nameof(StopManagerManagementEndpoints.AddStopManager))
            .WithDescription("Add a stop manager")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapDelete("api/stopmanagers/{id}", StopManagerManagementEndpoints.DeleteStopManager)
            .AddEndpointFilter(StopManagerManagementValidations.DeleteStopManagerValidationAsync)
            .WithName(nameof(StopManagerManagementEndpoints.DeleteStopManager))
            .WithDescription("Delete a stop manager")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("api/stopmanagers", StopManagerManagementEndpoints.UpdateStopManager)
            .WithName(nameof(StopManagerManagementEndpoints.UpdateStopManager))
            .WithDescription("Update a stop manager")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("api/stopmanagers/upload", StopManagerManagementEndpoints.UploadCsvFile)
            .AddEndpointFilter(StopManagerManagementValidations.UploadCsvFileValidationAsync)
            .DisableAntiforgery();
    }
}