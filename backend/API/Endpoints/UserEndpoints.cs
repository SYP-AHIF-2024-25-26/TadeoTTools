using LeoAuth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1/api");

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
        
        group.MapGet("/token-data", static (HttpContext httpContext) =>
        {
            var userInfo = httpContext.User.GetLeoUserInformation();
            return userInfo.Match<ActionResult<List<string>>>(
                user => new OkObjectResult(GetUserInfo(user)),
                _ => new NotFoundResult()
            );
        }).RequireAuthorization();
    }

    private static List<string> GetUserInfo(LeoUser user)
    {
        List<string> data = [];

        user.Username.Switch(username => data.Add($"Username: {username}"), _ => { });

        var name = user.Name.Match(
            fullName => fullName.Name,
            firstNameOnly => firstNameOnly.FirstName,
            lastNameOnly => lastNameOnly.LastName,
            _ => string.Empty
        );
        if (!string.IsNullOrEmpty(name))
        {
            data.Add($"Name: {name}");
        }

        user.Department.Switch(department => data.Add($"Department: {department.Name}"), _ => { });

        string? role = user.IsStudent ? "Student" :
                       user.IsTeacher ? "Teacher" :
                       user.IsTestUser ? "Test User" : null;

        if (role != null)
        {
            data.Add($"Role: {role}");
        }

        return data;
    }
}
