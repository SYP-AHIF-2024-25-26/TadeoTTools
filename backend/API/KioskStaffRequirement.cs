using Database.Entities;
using Database.Repository;
using LeoAuth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace API;

/// <summary>
/// Who may work at a kiosk that needs a login: every teacher (from the LDAP entry in the token),
/// admins, and students whose assignment to the stop of that kiosk is accepted. With
/// <see cref="KioskStaffRequirement.StopStaffOnly"/> teachers don't pass by themselves; the stop
/// managers of that stop do.
/// </summary>
public class KioskStaffAuthorizationHandler(TadeoTDbContext dbContext) : AuthorizationHandler<KioskStaffRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        KioskStaffRequirement requirement)
    {
        var isTeacher = !requirement.StopStaffOnly
            && context.User.GetLeoUserInformation().Match(user => user.IsTeacher, _ => false);
        if (isTeacher)
        {
            context.Succeed(requirement);
            return;
        }

        var userId = context.User.FindFirst("preferred_username")?.Value?.ToLower();
        if (userId != null)
        {
            var isAdmin = await dbContext.Admins.AnyAsync(a => a.Id.ToLower() == userId);
            if (isAdmin || await IsAtStopAsync(dbContext, userId, requirement))
            {
                context.Succeed(requirement);
                return;
            }
        }

        context.Fail(new AuthorizationFailureReason(this,
            $"Neither teacher nor assigned to the stop \"{requirement.StopName}\""));
    }

    /// <summary>
    /// Whether the user works at the stop: an accepted student assignment, with
    /// <see cref="KioskStaffRequirement.StopStaffOnly"/> also a stop-manager assignment.
    /// </summary>
    /// <param name="userId">The <c>preferred_username</c>, lower case.</param>
    public static async Task<bool> IsAtStopAsync(TadeoTDbContext dbContext, string userId,
        KioskStaffRequirement requirement)
    {
        var isStopStudent = await dbContext.StudentAssignments.AnyAsync(a =>
            a.EdufsUsername.ToLower() == userId
            && a.Status == Status.ACCEPTED
            && a.Stop!.Name.ToLower() == requirement.StopName);
        return isStopStudent || requirement.StopStaffOnly
            && await dbContext.StopManagerAssignments.AnyAsync(a =>
                a.StopManagerId.ToLower() == userId
                && a.Stop!.Name.ToLower() == requirement.StopName);
    }
}

/// <param name="StopName">Name of the stop whose students may use the kiosk, lower case.</param>
/// <param name="StopStaffOnly">Only the people of that stop (its stop managers and accepted students) and
/// admins, not every teacher.</param>
public record KioskStaffRequirement(string StopName, bool StopStaffOnly = false) : IAuthorizationRequirement
{
    /// <summary>The cashier kiosk.</summary>
    public const string BuffetStopName = "buffet";

    /// <summary>The registration kiosk at the entrance.</summary>
    public const string ReceptionStopName = "empfang";

    /// <summary>The stop that prints the visitor photos (photo section in the dashboard).</summary>
    public const string PhotoStopName = "roboterführerschein";

    /// <summary>The visitor photos: admins and the people of the Roboterführerschein stop.</summary>
    public static readonly KioskStaffRequirement PhotoViewer = new(PhotoStopName, StopStaffOnly: true);
}
