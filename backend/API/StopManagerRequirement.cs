using Database.Repository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace API;

/// <summary>
/// Admins and the stop managers assigned to one stop, for a dashboard page that belongs to that stop.
/// Being a stop manager elsewhere is not enough, and teachers and students don't pass by themselves.
/// </summary>
public class StopManagerAuthorizationHandler(TadeoTDbContext dbContext) : AuthorizationHandler<StopManagerRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        StopManagerRequirement requirement)
    {
        var userId = context.User.FindFirst("preferred_username")?.Value?.ToLower();
        if (userId != null
            && (await dbContext.Admins.AnyAsync(a => a.Id.ToLower() == userId)
                || await dbContext.StopManagerAssignments.AnyAsync(a =>
                    a.StopManagerId.ToLower() == userId
                    && a.Stop!.Name.ToLower() == requirement.StopName)))
        {
            context.Succeed(requirement);
            return;
        }

        context.Fail();
    }
}

/// <param name="StopName">Name of the stop, lower case.</param>
public record StopManagerRequirement(string StopName) : IAuthorizationRequirement;
