using System.ComponentModel.DataAnnotations;
using Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Database.Repository.Functions;

public class StudentFunctions
{
    public record StudentDto(
         [Required, MaxLength(100)] string EdufsUsername,
         [Required, MaxLength(150)] string FirstName,
         [Required, MaxLength(150)] string LastName,
         [Required, MaxLength(20)] string StudentClass,
         [Required, MaxLength(100)] string Department,
         List<StudentAssignmentDto> StudentAssignments
    );

    public record StudentAssignmentDto(
        int Id,
        [Required, MaxLength(100)] string EdufsUsername,
        int StopId,
        string StopName,
        Status Status
    );

    public static async Task<List<StudentDto>> GetAllStudentsAsync(TadeoTDbContext context)
    {
        return await context.Students
            .Include(s => s.StudentAssignments)
            .ThenInclude(sa => sa.Stop)
            .Select(student => new StudentDto(
                student.EdufsUsername,
                student.FirstName,
                student.LastName,
                student.StudentClass,
                student.Department,
                student.StudentAssignments.Select(assignment => new StudentAssignmentDto(
                    assignment.Id,
                    assignment.EdufsUsername,
                    assignment.StopId,
                    assignment.Stop != null ? assignment.Stop.Name : "Unknown Stop",
                    assignment.Status
                )).ToList()
            )).ToListAsync();
    }

    public static async Task<Student?> GetStudentByEdufsUsername(TadeoTDbContext context, string edufsUsername)
    {
        return await context.Students
            .Include(s => s.StudentAssignments)
            .ThenInclude(sa => sa.Stop)
            .FirstOrDefaultAsync(s => EF.Functions.ILike(s.EdufsUsername, edufsUsername));
    }


    public static async Task ParseStudentsCsv(string csvData, TadeoTDbContext context)
    {
        var lines = csvData.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries);

        if (lines.Length > 0)
        {
            var header = lines[0].Split(';');
            if (header is ["EdufsUsername", "FirstName", "LastName", "StudentClass", "Department"])
            {
                lines = lines.Skip(1).ToArray(); // Skip header line
            }

            var students = lines
                .Select(line => line.Split(';'))
                .Select(cols => new Student
                {
                    EdufsUsername = cols[0],
                    FirstName = cols[1],
                    LastName = cols[2],
                    StudentClass = cols[3],
                    Department = cols[4],
                })
                .Where(s => !context.Students.Any(st => EF.Functions.ILike(st.EdufsUsername, s.EdufsUsername)));

            await context.Students.AddRangeAsync(students);
            await context.SaveChangesAsync();
        }
        else
        {
            throw new ArgumentException("Empty CSV file");
        }
    }

    public static async Task ParseStudentAssignmentsCsv(string csvData, TadeoTDbContext context)
    {
        var lines = csvData.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries);

        if (lines.Length == 0)
        {
            throw new ArgumentException("Empty CSV file");
        }

        var header = lines[0].Split(';');
        var dataLines = lines;

        // Skip header if present (Stop;Klasse;Nachname;Vorname;Abteilung)
        if (header is ["Stop", "Klasse", "Nachname", "Vorname", "Abteilung"])
        {
            dataLines = lines.Skip(1).ToArray();
        }

        if (dataLines.Length == 0)
        {
            throw new ArgumentException("CSV file contains only headers");
        }

        var errors = new List<string>();
        var assignmentsToAdd = new List<StudentAssignment>();

        foreach (var line in dataLines)
        {
            var cols = line.Split(';');

            if (cols.Length < 5)
            {
                errors.Add($"Invalid line format: {line}");
                continue;
            }

            var stopName = cols[0].Trim();
            var studentClass = cols[1].Trim();
            var lastName = cols[2].Trim();
            var firstName = cols[3].Trim();
            var department = cols[4].Trim();

            // Find the stop by name
            var stop = await context.Stops.FirstOrDefaultAsync(s => EF.Functions.ILike(s.Name, stopName));
            if (stop == null)
            {
                errors.Add($"Stop not found: {stopName}");
                continue;
            }

            // Find the student by matching all fields
            var student = await context.Students.FirstOrDefaultAsync(s =>
                EF.Functions.ILike(s.StudentClass, studentClass) &&
                EF.Functions.ILike(s.LastName, lastName) &&
                EF.Functions.ILike(s.FirstName, firstName) &&
                EF.Functions.ILike(s.Department, department));

            if (student == null)
            {
                errors.Add($"Student not found: {firstName} {lastName}, Class: {studentClass}, Department: {department}");
                continue;
            }

            // Check if assignment already exists
            var existingAssignment = await context.StudentAssignments
                .FirstOrDefaultAsync(sa => EF.Functions.ILike(sa.EdufsUsername, student.EdufsUsername) && sa.StopId == stop.Id);

            if (existingAssignment != null)
            {
                // Skip duplicate assignments
                continue;
            }

            // Create new assignment with Pending status
            assignmentsToAdd.Add(new StudentAssignment
            {
                EdufsUsername = student.EdufsUsername,
                StopId = stop.Id,
                Status = Status.PENDING
            });
        }

        if (errors.Count > 0)
        {
            throw new ArgumentException($"Errors occurred during import:\n{string.Join("\n", errors)}");
        }

        if (assignmentsToAdd.Count == 0)
        {
            throw new ArgumentException("No valid assignments found to import (all may be duplicates)");
        }

        await context.StudentAssignments.AddRangeAsync(assignmentsToAdd);
        await context.SaveChangesAsync();
    }
}