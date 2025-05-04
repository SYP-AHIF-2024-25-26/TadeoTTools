using Database.Entities;
using Database.Repository;
using LeoAuth;

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

        string? role = user.IsStudent ? "Student" :
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
                var student = await context.Students.FindAsync(username);
                if (student != null)
                    return Results.Ok("Student");
                var teacher = await context.Teachers.FindAsync(username);
                if (teacher != null)
                    return Results.Ok("Teacher");
                var admin = await context.Admins.FindAsync(username);
                if (admin != null)
                    return Results.Ok("Admin");
                return Results.NotFound("User not found");
            },
            _ => Task.FromResult(Results.BadRequest("User information not found"))
        );
    }
}
