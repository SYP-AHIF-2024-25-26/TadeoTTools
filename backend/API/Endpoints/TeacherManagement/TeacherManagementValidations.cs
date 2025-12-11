using Database.Repository;
using Database.Repository.Functions;

namespace API.Endpoints.TeacherManagement;

public static class TeacherManagementValidations
{
    public static async ValueTask<object?> GetTeacherByIdValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var teacherId = context.GetArgument<string>(1);

        if (string.IsNullOrWhiteSpace(teacherId))
        {
            return Results.BadRequest("Teacher ID is required.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> DeleteTeacherValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var teacherId = context.GetArgument<string>(1);

        if (string.IsNullOrWhiteSpace(teacherId))
        {
            return Results.BadRequest("Teacher ID is required.");
        }

        var teacherExists = await dbContext.Teachers.FindAsync(teacherId);
        if (teacherExists == null)
        {
            return Results.NotFound($"Teacher with ID {teacherId} not found.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> UploadCsvFileValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var file = context.GetArgument<TeacherManagementEndpoints.UploadTeacherCsvFileDto>(0);

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

