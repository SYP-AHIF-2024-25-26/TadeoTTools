using System.Text;
using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.StudentManagement;

public class StudentManagementEndpoints
{
    public static async Task<IResult> GetAllStudents(TadeoTDbContext context)
    {
        return Results.Ok(await StudentFunctions.GetAllStudentsAsync(context));
    }

    public static async Task<IResult> UpdateStudent(TadeoTDbContext context, StudentFunctions.StudentDto studentDto)
    {
        var student = await context.Students
            .Include(s => s.StudentAssignments)
            .FirstOrDefaultAsync(s => s.EdufsUsername == studentDto.EdufsUsername);

        if (student == null)
        {
            return Results.NotFound("Student not found");
        }

        student.FirstName = studentDto.FirstName;
        student.LastName = studentDto.LastName;
        student.StudentClass = studentDto.StudentClass;
        student.Department = studentDto.Department;

        student.StudentAssignments.Clear();

        foreach (var assignmentDto in studentDto.StudentAssignments)
        {
            student.StudentAssignments.Add(new StudentAssignment
            {
                StudentId = assignmentDto.StudentId,
                StopId = assignmentDto.StopId,
                Status = assignmentDto.Status
            });
        }

        await context.SaveChangesAsync();

        return Results.Ok("Student updated successfully");
    }

    public static async Task<IResult> UploadCsvFile([FromForm] UploadStudentCsvFileDto file, TadeoTDbContext context)
    {
        if (file.File.Length <= 0) return Results.BadRequest("File upload failed");
        try
        {
            using (var stream = new MemoryStream())
            {
                await file.File.CopyToAsync(stream);
                var csvData = Encoding.UTF8.GetString(stream.ToArray());
                await StudentFunctions.ParseStudentsCsv(csvData, context);
            }

            return Results.Ok("File uploaded successfully");
        }
        catch (Exception e)
        {
            return Results.BadRequest($"File upload failed: {e.Message}");
        }
    }

    public record UploadStudentCsvFileDto(IFormFile File);

    public static async Task<IResult> DeleteStudentAssignment([FromRoute] string studentId, [FromRoute] int stopId,
        TadeoTDbContext context)
    {
        var assignment = await context.StudentAssignments
            .FirstOrDefaultAsync(sa => sa.StudentId == studentId && sa.StopId == stopId);

        if (assignment == null)
        {
            return Results.NotFound($"No assignment found for StudentId '{studentId}' and StopId '{stopId}'.");
        }

        context.StudentAssignments.Remove(assignment);
        await context.SaveChangesAsync();

        return Results.Ok($"Assignment for StudentId '{studentId}' and StopId '{stopId}' has been deleted.");
    }

    public static async Task DeleteAllStudents(TadeoTDbContext context)
    {
        context.StudentAssignments.RemoveRange(context.StudentAssignments);
        context.Students.RemoveRange(context.Students);
        await context.SaveChangesAsync();
    }

    public static async Task<IResult> GetStudentsCsv(TadeoTDbContext context)
    {
        var students = await context.Students
            .Include(s => s.StudentAssignments)
            .ThenInclude(studentAssignment => studentAssignment.Stop)
            .OrderBy(s => s.Department)
            .ThenBy(s => s.StudentClass)
            .ThenBy(s => s.EdufsUsername)
            .ThenBy(s => s.LastName)
            .ThenBy(s => s.FirstName)
            .ToListAsync();

        var csvBuilder = new StringBuilder();

        // Add headers (ordered as: Department;Klasse;EdufsUsername;Nachname;Vorname)
        csvBuilder.AppendLine("Abteilung;Klasse;EdufsUsername;Nachname;Vorname;Stop(s);Status");

        // Add data rows (ordered as above)
        foreach (var item in students)
        {
            var escapedDepartment = Utils.EscapeCsvField(item.Department);
            var escapedClass = Utils.EscapeCsvField(item.StudentClass);
            var escapedEdufsUsername = Utils.EscapeCsvField(item.EdufsUsername);
            var escapedLastName = Utils.EscapeCsvField(item.LastName);
            var escapedFirstName = Utils.EscapeCsvField(item.FirstName);
            var escapedAssignments =
                Utils.EscapeCsvField(string.Join(",", item.StudentAssignments.Select(s => s.Stop.Name)));
            var status = item.StudentAssignments.Count switch
            {
                0 => "",
                > 1 => "CONFLICT",
                _ => item.StudentAssignments[0].Status.ToString()
            };
            var escapedStatus = Utils.EscapeCsvField(status);
            csvBuilder.AppendLine(
                $"{escapedDepartment};{escapedClass};{escapedEdufsUsername};{escapedLastName};{escapedFirstName};{escapedAssignments};{escapedStatus}");
        }

        var csvBytes = Utils.ToUtf8Bom(csvBuilder.ToString());

        return Results.File(
            fileContents: csvBytes,
            contentType: "text/csv",
            fileDownloadName: "students-export.csv"
        );
    }
}