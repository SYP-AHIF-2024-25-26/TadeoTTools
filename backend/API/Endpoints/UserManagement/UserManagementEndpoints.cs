using Database.Entities;
using Database.Repository;
using LeoAuth;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.UserManagement;

public class UserManagementEndpoints
{
    public static List<string> GetUserInfo(LeoUser user)
    {
        List<string> data = [];

        user.Username.Switch(username => data.Add($"username: {username}"), _ => { });

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

        user.Department.Switch(department => data.Add($"department: {department.Name}"), _ => { });

        var role = user.IsStudent ? "Student" :
            user.IsTeacher ? "Teacher" :
            user.IsTestUser ? "Test User" : null;

        if (role != null)
        {
            data.Add($"role: {role}");
        }

        return data;
    }

    public static async Task<IResult> UserInDatabase(TadeoTDbContext context, HttpContext httpContext)
    {
        var userInfo = httpContext.User.GetLeoUserInformation();
        return await userInfo.Match(
            async user =>
            {
                var username = user.Username.Match(u => u, _ => string.Empty);
                if (string.IsNullOrEmpty(username))
                    return Results.BadRequest("Username not found");
                var student = await context.Students
                    .FirstOrDefaultAsync(u => EF.Functions.ILike(username, u.EdufsUsername));
                if (student != null)
                    return Results.Ok("Student");
                var admin = await context.Admins
                    .FirstOrDefaultAsync(u => EF.Functions.ILike(username, u.Id));
                if (admin != null)
                    return Results.Ok("Admin");
                var stopManager = await context.StopManagers
                    .FirstOrDefaultAsync(u => EF.Functions.ILike(username, u.EdufsUsername));
                if (stopManager != null)
                    return Results.Ok("StopManager");
                return Results.NotFound("User not found");
            },
            _ => Task.FromResult(Results.BadRequest("User information not found"))
        );
    }
}