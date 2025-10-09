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
        
        group.MapGet("api/teachers/{id}", TeacherManagementEndpoints.GetTeacherById)
            .AddEndpointFilter(TeacherManagementValidations.GetTeacherByIdValidationAsync)
            .WithName(nameof(TeacherManagementEndpoints.GetTeacherById))
            .WithDescription("Get a teacher by id")
            .Produces<TeacherFunctions.TeacherWithStopsDto>()
            .Produces(StatusCodes.Status400BadRequest)
            .RequireAuthorization(Setup.TeacherOrAdminPolicyName);

        group.MapPost("api/teachers", TeacherManagementEndpoints.AddTeacher)
            .AddEndpointFilter(TeacherManagementValidations.AddTeacherValidationAsync)
            .WithName(nameof(TeacherManagementEndpoints.AddTeacher))
            .WithDescription("Add a teacher")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);
        
        group.MapDelete("api/teachers/{id}", TeacherManagementEndpoints.DeleteTeacher)
            .AddEndpointFilter(TeacherManagementValidations.DeleteTeacherValidationAsync)
            .WithName(nameof(TeacherManagementEndpoints.DeleteTeacher))
            .WithDescription("Delete a teacher")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);
        
        group.MapPut("api/teachers", TeacherManagementEndpoints.UpdateTeacher)
            .AddEndpointFilter(TeacherManagementValidations.UpdateTeacherValidationAsync)
            .WithName(nameof(TeacherManagementEndpoints.UpdateTeacher))
            .WithDescription("Update a teacher")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("api/teachers/upload", TeacherManagementEndpoints.UploadCsvFile)
            .AddEndpointFilter(TeacherManagementValidations.UploadCsvFileValidationAsync)
            .DisableAntiforgery();
    }
}