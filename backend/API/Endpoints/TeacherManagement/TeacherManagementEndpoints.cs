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

    public static async Task<IResult> GetTeacherById(TadeoTDbContext context, [FromRoute] string id)
    {
        var teacher = await TeacherFunctions.GetTeacherByUsernameAsync(context, id);
        return teacher == null ? Results.NotFound("Teacher not found") : Results.Ok(teacher);
    }

    public static async Task<IResult> SetTeacherAssignments(TadeoTDbContext context, [FromRoute] string id,
        TeacherAssignmentsDto[] assignments)
    {
        var teacher = await TeacherFunctions.GetTeacherByUsernameAsync(context, id);
        if (teacher == null)
        {
            return Results.NotFound("Teacher not found");
        }

        teacher.AssignedStops.Clear();
        teacher.AssignedStops.AddRange(assignments.Select(a => new TeacherAssignment
        {
            TeacherId = a.TeacherId,
            StopId = a.StopId
        }));
        await context.SaveChangesAsync();

        return Results.Ok();
    }

    public record TeacherAssignmentsDto(
        string TeacherId,
        int StopId
    );


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
        }
        catch (Exception e)
        {
            return Results.BadRequest($"File upload failed: {e.Message}");
        }
    }

    public static async Task<IResult> AddTeacher(TadeoTDbContext context, AddTeacherDto teacherToAdd)
    {
        var teacher = await context.Teachers.FindAsync(teacherToAdd.EdufsUsername);

        if (teacher != null)
        {
            return Results.BadRequest("Username already exists");
        }

        var teacherEntity = new Teacher
        {
            EdufsUsername = teacherToAdd.EdufsUsername,
            FirstName = teacherToAdd.FirstName,
            LastName = teacherToAdd.LastName
        };

        context.Teachers.Add(teacherEntity);
        await context.SaveChangesAsync();

        return Results.Created();
    }

    public static async Task<IResult> DeleteTeacher(TadeoTDbContext context, [FromRoute] string id)
    {
        var teacher = await context.Teachers.FindAsync(id);
        if (teacher == null)
        {
            return Results.NotFound("Teacher not found");
        }

        context.Teachers.Remove(teacher!);
        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public static async Task<IResult> UpdateTeacher(TadeoTDbContext context, AddTeacherDto teacherToUpdate)
    {
        var teacher = await context.Teachers.FindAsync(teacherToUpdate.EdufsUsername);
        if (teacher == null)
        {
            return Results.NotFound("Teacher not found");
        }

        teacher.FirstName = teacherToUpdate.FirstName;
        teacher.LastName = teacherToUpdate.LastName;
        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public record UploadTeacherCsvFileDto(IFormFile File);

    public record AddTeacherDto(string EdufsUsername, string FirstName, string LastName);
}