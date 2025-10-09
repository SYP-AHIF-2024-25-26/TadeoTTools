using Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Database.Repository.Functions;

public class StudentFunctions
{
    public record StudentDto(
         string EdufsUsername,
         string FirstName,
         string LastName,
         string StudentClass,
         string Department,
         List<StudentAssignmentDto> StudentAssignments
    );

    public record StudentAssignmentDto(
        int Id,
        string StudentId,
        int StopId,
        string StopName,
        Status Status
    );

    public static async Task<List<StudentDto>> GetAllStudentsAsync(TadeoTDbContext context)
    {
        return await context.Students
            .Include(student => student.StudentAssignments)
            .Select(student => new StudentDto(
                student.EdufsUsername,
                student.FirstName,
                student.LastName,
                student.StudentClass,
                student.Department,
                student.StudentAssignments.Select(assignment => new StudentAssignmentDto(
                    assignment.Id,
                    assignment.StudentId,
                    assignment.StopId,
                    assignment.Stop!.Name,
                    assignment.Status
                )).ToList()
            )).ToListAsync();
    }

    public static async Task<Student?> GetStudentByEdufsUsername(TadeoTDbContext context, string edufsUsername)
    {
        return await context.Students
            .Include(s => s.StudentAssignments)
            .FirstOrDefaultAsync(s => s.EdufsUsername == edufsUsername);
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
                .Where(s => !context.Students.Any(st => st.EdufsUsername.Equals(s.EdufsUsername)));
            
            await context.Students.AddRangeAsync(students);
            await context.SaveChangesAsync();
        } else 
        {
            throw new ArgumentException("Empty CSV file");
        }
    }
}