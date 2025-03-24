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
        
        group.MapPut("teachers/assign", TeacherManagementEndpoints.AssignStopToTeacher)
            .WithName(nameof(TeacherManagementEndpoints.AssignStopToTeacher))
            .WithDescription("Upsert a teacher/stop assignment")
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
            .Produces<ProblemDetails>(StatusCodes.Status200OK);
        
        group.MapPut("teachers/unassign", TeacherManagementEndpoints.UnassignStopToTeacher)
            .WithName(nameof(TeacherManagementEndpoints.UnassignStopToTeacher))
            .WithDescription("Upsert a teacher/stop assignment")
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
            .Produces<ProblemDetails>(StatusCodes.Status200OK);
    }
}