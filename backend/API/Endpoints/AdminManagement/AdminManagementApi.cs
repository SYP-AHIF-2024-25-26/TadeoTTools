namespace API.Endpoints.AdminManagement;

public static class AdminManagementApi
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1/api");

        group.MapPost("/admins", AdminManagementEndpoints.AddAdmin)
            .WithName(nameof(AdminManagementEndpoints.AddAdmin))
            .WithDescription("Add an admin")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapDelete("/admins/{name}", AdminManagementEndpoints.DeleteAdmin)
            .WithName(nameof(AdminManagementEndpoints.DeleteAdmin))
            .WithDescription("Delete an admin")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapGet("/admins", AdminManagementEndpoints.GetAllAdmins)
            .WithName(nameof(AdminManagementEndpoints.GetAllAdmins))
            .WithDescription("Get all admins")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);
    }
}