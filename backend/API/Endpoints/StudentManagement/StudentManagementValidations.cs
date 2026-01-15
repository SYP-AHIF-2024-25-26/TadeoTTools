namespace API.Endpoints.StudentManagement;

public static class StudentManagementValidations
{
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