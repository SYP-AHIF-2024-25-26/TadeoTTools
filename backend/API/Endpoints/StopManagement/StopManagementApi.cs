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

        group.MapGet("api/stops/stop-manager/{stopManagerId}", StopManagementEndpoints.GetStopsForStopManager)
            .WithName(nameof(StopManagementEndpoints.GetStopsForStopManager))
            .WithDescription("Get all stops assigned to a specific stop manager")
            .Produces<List<StopWithAssignmentsAndDivisionsDto>>()
            .RequireAuthorization(Setup.StopManagerOrAdminPolicyName);

        group.MapGet("stops", StopManagementEndpoints.GetPublicStops)
            .WithName(nameof(StopManagementEndpoints.GetPublicStops))
            .WithDescription("Get all stops that are publicly available to see")
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
            .WithName(nameof(StopManagementEndpoints.UpdateStop))
            .WithDescription("Update a stop")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("stop-manager/stops", StopManagementEndpoints.UpdateStopAsStopManager)
            .WithName(nameof(StopManagementEndpoints.UpdateStopAsStopManager))
            .WithDescription("Update the stops assigned to a stop manager")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.StopManagerOrAdminPolicyName);

        group.MapDelete("api/stops/{stopId:int}", StopManagementEndpoints.DeleteStop)
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

        group.MapGet("api/stops/{stopId:int}/csv", StopManagementEndpoints.GetStopCsv)
            .WithName(nameof(StopManagementEndpoints.GetStopCsv))
            .WithDescription("Get a stop in a csv file")
            .Produces(StatusCodes.Status206PartialContent)
            .Produces(StatusCodes.Status416RangeNotSatisfiable)
            .RequireAuthorization(Setup.StopManagerOrAdminPolicyName);

        group.MapGet("api/stops/{stopId:int}", StopManagementEndpoints.GetStopById)
            .WithName(nameof(StopManagementEndpoints.GetStopById))
            .WithDescription("Get a stop by its id")
            .Produces<StopWithAssignmentsAndDivisionsDto>()
            .Produces(StatusCodes.Status404NotFound)
            .RequireAuthorization(Setup.StopManagerOrAdminPolicyName); // fix later to admin only

        group.MapGet("api/stops/by-division", StopManagementEndpoints.GetStopsByDivisionId)
            .WithName(nameof(StopManagementEndpoints.GetStopsByDivisionId))
            .WithDescription("Get all stops filtered by divisionId query parameter")
            .Produces<List<StopWithAssignmentsAndDivisionsDto>>()
            .RequireAuthorization(Setup.StopManagerOrAdminPolicyName);
    }
}