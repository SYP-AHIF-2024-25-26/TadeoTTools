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

    public static async Task<IResult> GenerateRandomAssignments(TadeoTDbContext context)
    {
        var rnd = new Random();
        var allStudentUsernames = await context.Students.Select(s => s.EdufsUsername).ToListAsync();
        var skippedStudents = allStudentUsernames.OrderBy(_ => rnd.Next()).Take(20).ToList();

        var baseAssignments = await context.Students
            .Where(s => !skippedStudents.Contains(s.EdufsUsername))
            .Select(s => new StudentAssignment
            {
                StudentId = s.EdufsUsername,
                StopId = rnd.Next(1, 41),
                Status = (Status)rnd.Next(0, 3)
            }).ToListAsync();
        
        var duplicateStudents = baseAssignments
            .Select(a => a.StudentId)
            .Distinct()
            .OrderBy(_ => rnd.Next())
            .Take((int)(context.Students.Count() * 0.08)) // 8% der Students
            .ToList();
        
        var duplicateAssignments = new List<StudentAssignment>();

        foreach (var studentId in duplicateStudents)
        {
            var extraCount = rnd.Next(1, 3); // 1 or 2 additional assignments
            for (var i = 0; i < extraCount; i++)
            {
                duplicateAssignments.Add(new StudentAssignment
                {
                    StudentId = studentId,
                    StopId = rnd.Next(1, 41),
                    Status = (Status)rnd.Next(0, 3)
                });
            }
        }
        var allAssignments = baseAssignments.Concat(duplicateAssignments).ToList();
        await context.StudentAssignments.AddRangeAsync(allAssignments);
        await context.SaveChangesAsync();
        return Results.Ok();
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

    public static async Task<IResult> SetStudentAssignments(TadeoTDbContext context, [FromRoute] string id, StudentAssignment[] assignments)
    {
        var student = await StudentFunctions.GetStudentByEdufsUsername(context, id);
        if (student == null)
        {
            return Results.NotFound("Student not found");
        }

        student.StudentAssignments.Clear();
        student.StudentAssignments.AddRange(assignments);
        await context.SaveChangesAsync();

        return Results.Ok();
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
        } catch (Exception e)
        {
            return Results.BadRequest($"File upload failed: {e.Message}");
        }
        
    }
    
    public record UploadStudentCsvFileDto(IFormFile File);
    public static async Task<IResult> DeleteStudentAssignment([FromRoute] string studentId, [FromRoute] int stopId, TadeoTDbContext context) 
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
            .OrderBy(s => s.StudentClass)
            .ThenBy(s => s.LastName)
            .ToListAsync();
        
        var csvBuilder = new StringBuilder();
    
        // Add headers
        csvBuilder.AppendLine("Vorname;Nachname;EdufsUsername;Klasse;Abteilung;Stop(s);Status");
        
        // Add data rows
        foreach (var item in students)
        {
            var escapedFirstName = Utils.EscapeCsvField(item.FirstName);
            var escapedLastName = Utils.EscapeCsvField(item.LastName);
            var escapedEdufsUsername = Utils.EscapeCsvField(item.EdufsUsername);
            var escapedClass = Utils.EscapeCsvField(item.StudentClass);
            var escapedDepartment = Utils.EscapeCsvField(item.Department);
            var escapedAssignments =
                Utils.EscapeCsvField(string.Join(",", item.StudentAssignments.Select(s => s.Stop.Name)));
            var status = item.StudentAssignments.Count switch
            {
                0 => "",
                > 1 => "CONFLICT",
                _ => item.StudentAssignments[0].Status.ToString()
            };
            var escapedStatus = Utils.EscapeCsvField(status);
            csvBuilder.AppendLine($"{escapedFirstName};{escapedLastName};{escapedEdufsUsername};{escapedClass};{escapedDepartment};{escapedAssignments};{escapedStatus}");
        }
    
        var csvBytes = Encoding.UTF8.GetBytes(csvBuilder.ToString());
    
        return Results.File(
            fileContents: csvBytes,
            contentType: "text/csv",
            fileDownloadName: "students-export.csv"
        );
    }    
}