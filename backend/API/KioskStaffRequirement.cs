using Database.Entities;
using Database.Repository;
using LeoAuth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace API;

/// <summary>
/// Who may work at a kiosk that needs a login: every teacher (from the LDAP entry in the token),
/// admins, and students whose assignment to the stop of that kiosk is accepted.
/// </summary>
public class KioskStaffAuthorizationHandler(TadeoTDbContext dbContext) : AuthorizationHandler<KioskStaffRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        KioskStaffRequirement requirement)
    {
        var isTeacher = context.User.GetLeoUserInformation().Match(user => user.IsTeacher, _ => false);
        if (isTeacher)
        {
            context.Succeed(requirement);
            return;
        }

        var userId = context.User.FindFirst("preferred_username")?.Value?.ToLower();
        if (userId != null)
        {
            var isAdmin = await dbContext.Admins.AnyAsync(a => a.Id.ToLower() == userId);
            var isStopStudent = await dbContext.StudentAssignments.AnyAsync(a =>
                a.EdufsUsername.ToLower() == userId
                && a.Status == Status.ACCEPTED
                && a.Stop!.Name.ToLower() == requirement.StopName);
            if (isAdmin || isStopStudent)
            {
                context.Succeed(requirement);
                return;
            }
        }

        context.Fail(new AuthorizationFailureReason(this,
            $"Neither teacher nor assigned to the stop \"{requirement.StopName}\""));
    }
}

/// <param name="StopName">Name of the stop whose students may use the kiosk, lower case.</param>
public record KioskStaffRequirement(string StopName) : IAuthorizationRequirement
{
    /// <summary>The cashier kiosk.</summary>
    public const string BuffetStopName = "buffet";

    /// <summary>The registration kiosk at the entrance.</summary>
    public const string ReceptionStopName = "empfang";
}
