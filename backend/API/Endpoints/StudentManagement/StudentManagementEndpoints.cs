using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
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
    
    public static async Task<IResult> SetAssignments(TadeoTDbContext context, [FromRoute] string id, StudentAssignment[] assignments)
    {
        var student = await StudentFunctions.GetStudentByEdufsUsername(context, id);
        if (student == null)
        {
            return Results.NotFound("Student not found");
        }
        
        student.StudentAssignments.Clear();
        student.StudentAssignments.AddRange(assignments);
        await context.SaveChangesAsync();

        return Results.Ok(student);
    }
}