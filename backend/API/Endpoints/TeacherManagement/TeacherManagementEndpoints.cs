using System.Text;
using API.Endpoints.StudentManagement;
using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using Microsoft.AspNetCore.Mvc;

namespace API.Endpoints.TeacherManagement;

public static class TeacherManagementEndpoints
{
    public static async Task<IResult> GetAllTeachers(TadeoTDbContext context)
    {
        return Results.Ok(await TeacherFunctions.GetAllTeachersAsync(context));
    }

    public static async Task<IResult> SetTeacherAssignments(TadeoTDbContext context, [FromRoute] string id, TeacherAssignment[] assignments)
    {
        var teacher = await TeacherFunctions.GetTeacherByUsernameAsync(context, id);
        if (teacher == null)
        {
            return Results.NotFound("Teacher not found");
        }

        teacher.AssignedStops.Clear();
        teacher.AssignedStops.AddRange(assignments);
        await context.SaveChangesAsync();

        return Results.Ok();
    }
    
    public static async Task<IResult> UploadCsvFile([FromForm] UploadTeacherCsvFileDto file, TadeoTDbContext context)
    {
        if (file.File.Length <= 0) return Results.BadRequest("File upload failed");
        try
        {
            using (var stream = new MemoryStream())
            {
                await file.File.CopyToAsync(stream);
                var csvData = Encoding.UTF8.GetString(stream.ToArray()); 
                await TeacherFunctions.ParseTeacherCsv(csvData, context);
            }
            return Results.Ok("File uploaded successfully");
        } catch (Exception e)
        {
            return Results.BadRequest($"File upload failed: {e.Message}");
        }
    }
    
    public record UploadTeacherCsvFileDto(IFormFile File);
}