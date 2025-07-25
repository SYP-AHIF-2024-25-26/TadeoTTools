using Database.Repository.Functions;
using LeoAuth;

namespace API.Endpoints.StopManagement;

public static class StopManagementApi
{
    public static void MapStopEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");
        group.MapGet("api/stops", StopManagementEndpoints.GetAllStops)
            .WithName(nameof(StopManagementEndpoints.GetAllStops))
            .WithDescription("Get all Stops")
            .Produces<List<StopWithAssignmentsAndDivisionsDto>>()
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapGet("stops", StopManagementEndpoints.GetPublicStops)
            .WithName(nameof(StopManagementEndpoints.GetPublicStops))
            .WithDescription("Get all stops that are publically available to see")
            .Produces<List<StopWithAssignmentsAndDivisionsDto>>();

        group.MapGet("stops/correlating", StopManagementEndpoints.GetCorrelatingStops)
            .WithName(nameof(StopManagementEndpoints.GetCorrelatingStops))
            .WithDescription("Get the correlating stops of a student")
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(nameof(LeoUserRole.Student));

        group.MapPost("api/stops", StopManagementEndpoints.CreateStop)
            .AddEndpointFilter(StopManagementValidations.CreateStopValidationAsync)
            .WithName(nameof(StopManagementEndpoints.CreateStop))
            .WithDescription("Create a new stop")
            .Produces(StatusCodes.Status404NotFound)
            .Produces<StopManagementEndpoints.StopResponseDto>()
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("api/stops", StopManagementEndpoints.UpdateStop)
            .AddEndpointFilter(StopManagementValidations.UpdateStopValidationAsync)
            .WithName(nameof(StopManagementEndpoints.UpdateStop))
            .WithDescription("Update a stop")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.TeacherOrAdminPolicyName);


        group.MapDelete("api/stops/{stopId}", StopManagementEndpoints.DeleteStop)
            .AddEndpointFilter(StopManagementValidations.DeleteStopValidationAsync)
            .WithName(nameof(StopManagementEndpoints.DeleteStop))
            .WithDescription("Delete a stop by its id")
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapGet("api/stops/csv", StopManagementEndpoints.GetStopsCsv)
            .WithName(nameof(StopManagementEndpoints.GetStopsCsv))
            .WithDescription("Get all stops in a csv file")
            .Produces(StatusCodes.Status206PartialContent)
            .Produces(StatusCodes.Status416RangeNotSatisfiable)
            .RequireAuthorization(Setup.AdminPolicyName);
    }
}