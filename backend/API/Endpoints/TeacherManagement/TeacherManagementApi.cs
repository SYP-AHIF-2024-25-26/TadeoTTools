using Database.Repository.Functions;
using Microsoft.AspNetCore.Mvc;

namespace API.Endpoints.TeacherManagement;

public static class TeacherManagementApi
{
    public static void MapTeacherEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");
        group.MapGet("api/teachers", TeacherManagementEndpoints.GetAllTeachers)
            .WithName(nameof(TeacherManagementEndpoints.GetAllTeachers))
            .WithDescription("Get all teachers")
            .Produces<List<TeacherFunctions.TeacherWithStopsDto>>();

        group.MapPut("teachers/{id}/assignments", TeacherManagementEndpoints.SetTeacherAssignments)
            .WithName(nameof(TeacherManagementEndpoints.SetTeacherAssignments))
            .WithDescription("Set assignments for a teacher")
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK);
        //.RequireAuthorization(Setup.TeacherOrAdminPolicyName);
    }
}