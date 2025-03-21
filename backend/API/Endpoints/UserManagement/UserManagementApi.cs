﻿using LeoAuth;
using Database.Repository;
using System.Security.Cryptography.X509Certificates;
using API.Endpoints.StopGroupManagement;
using Microsoft.AspNetCore.Mvc;

namespace API.Endpoints.UserManagement;

public static class UserManagementApi
{
    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1/api/users");

        group.MapGet("/at-least-logged-in", () =>
            Results.Ok("You are at least logged in")
        );

        group.MapGet("/at-least-student", () =>
            Results.Ok("You are at least a student")
        ).RequireAuthorization(nameof(LeoUserRole.Student));

        group.MapGet("/is-teacher", () =>
            Results.Ok("You are a teacher")
        ).RequireAuthorization(nameof(LeoUserRole.Teacher));

        group.MapGet("/everyone-allowed", () =>
            Results.Ok("Everyone is allowed to see this")
        ).AllowAnonymous();

        group.MapGet("/is-admin", () =>
            Results.Ok("You are an admin")
        ).RequireAuthorization(Setup.AdminPolicyName);

        group.MapGet("/token-data", static (HttpContext httpContext) =>
        {
            var userInfo = httpContext.User.GetLeoUserInformation();
            return userInfo.Match(
                user => Results.Ok(UserManagementEndpoints.GetUserInfo(user)),
                _ => Results.BadRequest("User information not found")
            );
        }).RequireAuthorization();

        group.MapPost("/admins", UserManagementEndpoints.AddAdmin)
            .WithName(nameof(UserManagementEndpoints.AddAdmin))
            .WithDescription("Add an admin")
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapDelete("/admins/{name}", UserManagementEndpoints.DeleteAdmin)
            .WithName(nameof(UserManagementEndpoints.DeleteAdmin))
            .WithDescription("Delete an admin")
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapGet("/admins", UserManagementEndpoints.GetAllAdmins)
            .WithName(nameof(UserManagementEndpoints.GetAllAdmins))
            .WithDescription("Get all admins")
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapGet("/correlating-stops", UserManagementEndpoints.GetCorrelatingStops)
            .WithName(nameof(UserManagementEndpoints.GetCorrelatingStops))
            .WithDescription("Get the correlating stops of a student")
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(nameof(LeoUserRole.Student));
    }
}
