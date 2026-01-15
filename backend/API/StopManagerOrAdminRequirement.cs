using Database.Repository;
using LeoAuth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace API;

public class StopManagerOrAdminHandler(TadeoTDbContext dbContext) : AuthorizationHandler<StopManagerOrAdminRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        StopManagerOrAdminRequirement requirement)
    {
        var user = context.User;

        var userId = user.FindFirst("preferred_username")?.Value;
        if (userId != null)
        {
            var isAdmin = await dbContext.Admins.AnyAsync(a => a.Id.ToLower() == userId.ToLower());
            if (isAdmin)
            {
                context.Succeed(requirement);
                return;
            }

            var isStopManager = await dbContext.StopManagers.AnyAsync(t => t.EdufsUsername.ToLower() == userId.ToLower());
            if (isStopManager)
            {
                context.Succeed(requirement);
                return;
            }
        }

        context.Fail();
    }
}

public class StopManagerOrAdminRequirement : IAuthorizationRequirement
{
}