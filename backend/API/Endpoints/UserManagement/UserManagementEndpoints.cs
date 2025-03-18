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

        string? role = user.IsStudent ? "Student" :
                       user.IsTeacher ? "Teacher" :
                       user.IsTestUser ? "Test User" : null;

        if (role != null)
        {
            data.Add($"role: {role}");
        }

        return data;
    }

    public record CorrelatingStopsDto(string Name, Status Status, string Description, string RoomNr);

    public static async Task<IResult> GetCorrelatingStops(TadeoTDbContext context, HttpContext httpContext)
    {
        var userInfo = httpContext.User.GetLeoUserInformation();

        return await userInfo.Match(
            async user =>
            {
                var username = user.Username.Match(u => u, _ => string.Empty);
                if (string.IsNullOrEmpty(username))
                    return Results.BadRequest("Username not found");

                var studentAssignments = await context.StudentAssignments
                    .Where(sa => sa.Student!.EdufsUsername == username)
                    .Select(sa => new CorrelatingStopsDto(sa.Stop!.Name, sa.Status, sa.Stop.Description, sa.Stop.RoomNr))
                    .ToListAsync();

                return Results.Ok(studentAssignments);
            },
            _ => Task.FromResult(Results.BadRequest("User information not found"))
        );
    }
}
