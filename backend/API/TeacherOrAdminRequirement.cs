using Database.Repository;
using LeoAuth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace API;

public class TeacherOrAdminHandler(TadeoTDbContext dbContext) : AuthorizationHandler<TeacherOrAdminRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        TeacherOrAdminRequirement requirement)
    {
        var user = context.User;

        var info = user.GetLeoUserInformation().Value;
        if (info is LeoUser leoUser)
        {
            var role = leoUser.Role;
            if (role >= LeoUserRole.Teacher)
            {
                context.Succeed(requirement);
                return;
            }
        }
        var userId = user.FindFirst("preferred_username")?.Value;
        if (userId != null)
        {
            var isAdmin = await dbContext.Admins.AnyAsync(a => a.Id.ToLower() == userId.ToLower());
            if (isAdmin)
            {
                context.Succeed(requirement);
                return;
            }
        }

        context.Fail();
    }
}

public class TeacherOrAdminRequirement : IAuthorizationRequirement { }

