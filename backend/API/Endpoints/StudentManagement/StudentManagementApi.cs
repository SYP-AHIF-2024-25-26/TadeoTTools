using Database.Repository.Functions;

namespace API.Endpoints.StudentManagement;

public static class StudentManagementApi
{
    public static void MapStudentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");
        group.MapGet("api/students", StudentManagementEndpoints.GetAllStudents)
            .WithName(nameof(StudentManagementEndpoints.GetAllStudents))
            .WithDescription("Get all students")
            .Produces<List<StudentFunctions.StudentDto>>()
            .RequireAuthorization(Setup.TeacherOrAdminPolicyName);

        group.MapPut("api/students/{id}", StudentManagementEndpoints.UpdateStudent)
            .WithName(nameof(StudentManagementEndpoints.UpdateStudent))
            .WithDescription("Update a student")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("api/students/assignments/generate", StudentManagementEndpoints.GenerateRandomAssignments)
            .WithName(nameof(StudentManagementEndpoints.GenerateRandomAssignments))
            .WithDescription("Generate random assignments for students")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK);
            //.RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("api/students/{id}/assignments", StudentManagementEndpoints.SetStudentAssignments)
            .WithName(nameof(StudentManagementEndpoints.SetStudentAssignments))
            .WithDescription("Set assignments for a student")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.TeacherOrAdminPolicyName);

        group.MapPost("api/students/upload", StudentManagementEndpoints.UploadCsvFile)
            .DisableAntiforgery();
        
        group.MapDelete("api/students/{studentId}/assignments/{stopId}", StudentManagementEndpoints.DeleteStudentAssignment)
            .WithName(nameof(StudentManagementEndpoints.DeleteStudentAssignment))
            .WithDescription("Delete a student assignment")
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.TeacherOrAdminPolicyName);
    }
}