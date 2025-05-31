using Database.Repository.Functions;

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

        group.MapPut("api/teachers/{id}/assignments", TeacherManagementEndpoints.SetTeacherAssignments)
            .WithName(nameof(TeacherManagementEndpoints.SetTeacherAssignments))
            .WithDescription("Set assignments for a teacher")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.TeacherOrAdminPolicyName);

        group.MapPost("api/teachers", TeacherManagementEndpoints.AddTeacher)
            .WithName(nameof(TeacherManagementEndpoints.AddTeacher))
            .WithDescription("Add a teacher")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);
        
        group.MapDelete("api/teachers", TeacherManagementEndpoints.DeleteTeacher)
            .WithName(nameof(TeacherManagementEndpoints.DeleteTeacher))
            .WithDescription("Delete a teacher")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);
        
        app.MapPut("api/teachers", TeacherManagementEndpoints.UpdateTeacher)
            .WithName(nameof(TeacherManagementEndpoints.UpdateTeacher))
            .WithDescription("Update a teacher")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("api/teachers/upload", TeacherManagementEndpoints.UploadCsvFile)
            .DisableAntiforgery();
    }
}