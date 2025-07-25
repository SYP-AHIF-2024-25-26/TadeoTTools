using Database.Entities;

namespace API.Endpoints.StopGroupManagement;

public static class StopGroupManagementApi
{
    public static void MapStopGroupEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");
        group.MapGet("groups", StopGroupManagementEndpoints.GetGroups)
            .WithName(nameof(StopGroupManagementEndpoints.GetGroups))
            .WithDescription("Get all public stop groups")
            .Produces<List<StopGroup>>();

        group.MapGet("api/groups", StopGroupManagementEndpoints.GetGroupsApi)
            .WithName(nameof(StopGroupManagementEndpoints.GetGroupsApi))
            .WithDescription("Get all stop groups")
            .Produces<List<StopGroup>>()
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("api/groups", StopGroupManagementEndpoints.CreateGroup)
            .WithName(nameof(StopGroupManagementEndpoints.CreateGroup))
            .WithDescription("Create a new stop group")
            .Produces<StopGroup>()
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("api/groups", StopGroupManagementEndpoints.UpdateGroup)
            .WithName(nameof(StopGroupManagementEndpoints.UpdateGroup))
            .WithDescription("Update a stop group")
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapDelete("api/groups/{groupId}", StopGroupManagementEndpoints.DeleteGroup)
            .AddEndpointFilter(StopGroupManagementValidations.DeleteGroupValidationAsync)
            .WithName(nameof(StopGroupManagementEndpoints.DeleteGroup))
            .WithDescription("Delete a stop group by its id")
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("api/groups/order", StopGroupManagementEndpoints.UpdateOrder)
            .WithName(nameof(StopGroupManagementEndpoints.UpdateOrder))
            .WithDescription("Update the order of the stop groups")
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);
        
        group.MapGet("api/groups/csv", StopGroupManagementEndpoints.GetGroupsCsv)
            .WithName(nameof(StopGroupManagementEndpoints.GetGroupsCsv))
            .WithDescription("Get all stop groups in a csv file")
            .Produces(StatusCodes.Status206PartialContent)
            .Produces(StatusCodes.Status416RangeNotSatisfiable)
            .RequireAuthorization(Setup.AdminPolicyName);
    }
}