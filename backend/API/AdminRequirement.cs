using Database.Repository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace API;

public class AdminAuthorizationHandler(TadeoTDbContext dbContext) : AuthorizationHandler<AdminRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AdminRequirement requirement)
    {
        var userId = context.User.FindFirst("preferred_username")?.Value; // not sure if this always works

        if (userId == null)
        {
            context.Fail(new AuthorizationFailureReason(this, "User not found"));
            return;
        }

        var isAdmin = await dbContext.Admins.AnyAsync(a => a.Id.ToLower() == userId.ToLower());

        if (isAdmin)
        {
            context.Succeed(requirement);
        }
        else
        {
            context.Fail(new AuthorizationFailureReason(this, "User does not have required role"));
        }
    }
}

public class AdminRequirement : IAuthorizationRequirement
{
}