using Database.Entities;
using Database.Repository;
using LeoAuth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace API;

/// <summary>
/// Who may use the cashier kiosk: every teacher (from the LDAP entry in the token), admins,
/// and students whose assignment to the stop named "Buffet" is accepted.
/// </summary>
public class CashierAuthorizationHandler(TadeoTDbContext dbContext) : AuthorizationHandler<CashierRequirement>
{
    public const string BuffetStopName = "buffet";

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        CashierRequirement requirement)
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
            var isBuffetStudent = await dbContext.StudentAssignments.AnyAsync(a =>
                a.EdufsUsername.ToLower() == userId
                && a.Status == Status.ACCEPTED
                && a.Stop!.Name.ToLower() == BuffetStopName);
            if (isAdmin || isBuffetStudent)
            {
                context.Succeed(requirement);
                return;
            }
        }

        context.Fail(new AuthorizationFailureReason(this, "Neither teacher nor assigned to the Buffet stop"));
    }
}

public class CashierRequirement : IAuthorizationRequirement
{
}
