using Database.Repository.Functions;
using Microsoft.AspNetCore.Mvc;

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
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.TeacherOrAdminPolicyName);
    }
}
