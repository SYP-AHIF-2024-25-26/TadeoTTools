using Database.Repository.Functions;

namespace API.Endpoints.StudentManagement;

public static class StudentManagementValidations
{
    public static async ValueTask<object?> UpdateStudentValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var studentDto = context.GetArgument<StudentFunctions.StudentDto>(1);

        if (string.IsNullOrWhiteSpace(studentDto.EdufsUsername))
        {
            return Results.BadRequest("EdufsUsername is required.");
        }

        if (string.IsNullOrWhiteSpace(studentDto.FirstName))
        {
            return Results.BadRequest("FirstName is required.");
        }

        if (string.IsNullOrWhiteSpace(studentDto.LastName))
        {
            return Results.BadRequest("LastName is required.");
        }

        if (string.IsNullOrWhiteSpace(studentDto.StudentClass))
        {
            return Results.BadRequest("StudentClass is required.");
        }

        if (string.IsNullOrWhiteSpace(studentDto.Department))
        {
            return Results.BadRequest("Department is required.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> UploadCsvFileValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var file = context.GetArgument<StudentManagementEndpoints.UploadStudentCsvFileDto>(0);

        if (file.File.Length == 0)
        {
            return Results.BadRequest("File cannot be empty.");
        }

        if (!file.File.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
        {
            return Results.BadRequest("File must be a CSV file.");
        }

        return await next(context);
    }

}