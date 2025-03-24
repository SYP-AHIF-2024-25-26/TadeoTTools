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
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status200OK);
        
        group.MapPut( "teachers/unassign/{stopId}", TeacherManagementEndpoints.UnassignTeachersFromStop)
            .WithName(nameof(TeacherManagementEndpoints.UnassignTeachersFromStop))
            .WithDescription("Unassign all teachers from a stop")
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status200OK);
    }
}