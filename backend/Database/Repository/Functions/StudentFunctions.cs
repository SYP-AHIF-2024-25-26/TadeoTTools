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
}