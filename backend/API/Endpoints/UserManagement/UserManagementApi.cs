using LeoAuth;

namespace API.Endpoints.UserManagement;

public static class UserManagementApi
{
    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1/api/users");

        group.MapGet("/at-least-logged-in", () =>
            Results.Ok("You are at least logged in")
        );

        group.MapGet("/at-least-student", () =>
            Results.Ok("You are at least a student")
        ).RequireAuthorization(nameof(LeoUserRole.Student));

        group.MapGet("/is-teacher", () =>
            Results.Ok("You are a teacher")
        ).RequireAuthorization(nameof(LeoUserRole.Teacher));

        group.MapGet("/everyone-allowed", () =>
            Results.Ok("Everyone is allowed to see this")
        ).AllowAnonymous();

        group.MapGet("/is-admin", () =>
            Results.Ok("You are an admin")
        ).RequireAuthorization(Setup.AdminPolicyName);

        group.MapGet("/token-data", static (HttpContext httpContext) =>
        {
            var userInfo = httpContext.User.GetLeoUserInformation();
            return userInfo.Match(
                user => Results.Ok(UserManagementEndpoints.GetUserInfo(user)),
                _ => Results.BadRequest("User information not found")
            );
        }).RequireAuthorization();

        app.MapGet("/in-database", UserManagementEndpoints.UserInDatabase)
            .WithName(nameof(UserManagementEndpoints.UserInDatabase))
            .WithDescription("Check if a user is in the database")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK);
    }
}
