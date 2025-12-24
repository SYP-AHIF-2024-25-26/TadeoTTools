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
            .Produces<List<StudentFunctions.StudentDto>>();
        //.RequireAuthorization(Setup.TeacherOrAdminPolicyName);

        group.MapPost("api/students", StudentManagementEndpoints.CreateStudent)
            .WithName(nameof(StudentManagementEndpoints.CreateStudent))
            .WithDescription("Create a new student")
            .Produces(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapDelete("api/students", StudentManagementEndpoints.DeleteAllStudents)
            .WithName(nameof(StudentManagementEndpoints.DeleteAllStudents))
            .WithDescription("Delete all students")
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("api/students/{id}", StudentManagementEndpoints.UpdateStudent)
            .WithName(nameof(StudentManagementEndpoints.UpdateStudent))
            .WithDescription("Update a student")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("api/students/upload", StudentManagementEndpoints.UploadCsvFile)
            .AddEndpointFilter(StudentManagementValidations.UploadCsvFileValidationAsync)
            .DisableAntiforgery();

        group.MapGet("api/students/csv", StudentManagementEndpoints.GetStudentsCsv)
            .WithName(nameof(StudentManagementEndpoints.GetStudentsCsv))
            .WithDescription("Get all students in a csv file")
            .Produces(StatusCodes.Status206PartialContent)
            .Produces(StatusCodes.Status416RangeNotSatisfiable)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("api/students/assignments/upload", StudentManagementEndpoints.UploadStudentAssignmentsCsv)
            .WithName(nameof(StudentManagementEndpoints.UploadStudentAssignmentsCsv))
            .WithDescription("Upload student assignments from CSV file")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .DisableAntiforgery()
            .RequireAuthorization(Setup.AdminPolicyName);
    }
}