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

    public record CashierUserDto(string Name, string StudentClass);

    /// <summary>
    /// Who is selling, for the cashier's status strip: name and class from the Students table,
    /// otherwise (teachers, admins) the name from the token without a class.
    /// </summary>
    public static async Task<IResult> GetCashierUser(TadeoTDbContext context, HttpContext httpContext)
    {
        var username = httpContext.User.FindFirst("preferred_username")?.Value ?? string.Empty;
        var student = await context.Students
            .FirstOrDefaultAsync(s => s.EdufsUsername.ToLower() == username.ToLower());
        var name = student != null
            ? $"{student.FirstName} {student.LastName}".Trim()
            : httpContext.User.GetLeoUserInformation().Match(
                user => user.Name.Match(
                    fullName => fullName.Name,
                    firstNameOnly => firstNameOnly.FirstName,
                    lastNameOnly => lastNameOnly.LastName,
                    _ => string.Empty),
                _ => string.Empty);
        return Results.Ok(new CashierUserDto(
            string.IsNullOrEmpty(name) ? username : name,
            student?.StudentClass ?? string.Empty));
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
                var admin = await context.Admins
                    .FirstOrDefaultAsync(u => EF.Functions.ILike(username, u.Id));
                if (admin != null)
                    return Results.Ok("Admin");
                var stopManager = await context.StopManagers
                    .FirstOrDefaultAsync(u => EF.Functions.ILike(username, u.EdufsUsername));
                if (stopManager != null)
                    return Results.Ok("StopManager");
                var student = await context.Students
                    .FirstOrDefaultAsync(u => EF.Functions.ILike(username, u.EdufsUsername));
                if (student != null)
                    return Results.Ok("Student");
                return Results.NotFound("User not found");
            },
            _ => Task.FromResult(Results.BadRequest("User information not found"))
        );
    }
}