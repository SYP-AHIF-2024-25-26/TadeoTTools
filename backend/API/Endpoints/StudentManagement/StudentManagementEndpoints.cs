using System.Text;
using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace API.Endpoints.StudentManagement;

public class StudentManagementEndpoints
{
    public static async Task<IResult> GetAllStudents(TadeoTDbContext context)
    {
        return Results.Ok(await StudentFunctions.GetAllStudentsAsync(context));
    }

    public record StudentNoAssignmentsDto(
        [Required, MaxLength(100)] string EdufsUsername,
        [Required, MaxLength(150)] string FirstName,
        [Required, MaxLength(150)] string LastName,
        [Required, MaxLength(20)] string StudentClass,
        [Required, MaxLength(100)] string Department
    );


    public static async Task<IResult> CreateStudent(TadeoTDbContext context, StudentNoAssignmentsDto studentDto)
    {
        // Check if student already exists
        var existing = await context.Students.FirstOrDefaultAsync(s => s.EdufsUsername == studentDto.EdufsUsername);
        if (existing != null)
        {
            return Results.Conflict("A student with the same EdufsUsername already exists.");
        }

        var student = new Student
        {
            EdufsUsername = studentDto.EdufsUsername,
            FirstName = studentDto.FirstName,
            LastName = studentDto.LastName,
            StudentClass = studentDto.StudentClass,
            Department = studentDto.Department,
            StudentAssignments = []
        };

        context.Students.Add(student);
        await context.SaveChangesAsync();

        return Results.Ok("Student created successfully");
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
                EdufsUsername = assignmentDto.EdufsUsername,
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

    public static async Task<IResult> DeleteStudentAssignment([FromRoute] string edufsUsername, [FromRoute] int stopId,
        TadeoTDbContext context)
    {
        var assignment = await context.StudentAssignments
            .FirstOrDefaultAsync(sa => sa.EdufsUsername == edufsUsername && sa.StopId == stopId);

        if (assignment == null)
        {
            return Results.NotFound($"No assignment found for EdufsUsername '{edufsUsername}' and StopId '{stopId}'.");
        }

        context.StudentAssignments.Remove(assignment);
        await context.SaveChangesAsync();

        return Results.Ok($"Assignment for EdufsUsername '{edufsUsername}' and StopId '{stopId}' has been deleted.");
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
                Utils.EscapeCsvField(string.Join(",", item.StudentAssignments.Select(s => s?.Stop?.Name)));
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