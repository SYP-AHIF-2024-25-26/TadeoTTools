using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.TeacherManagement;

public static class TeacherManagementEndpoints
{
    public static async Task<IResult> GetAllTeachers(TadeoTDbContext context)
    {
        return Results.Ok(await TeacherFunctions.GetAllTeachersAsync(context));
    }

    public static async Task<IResult> AssignStopToTeacher(TadeoTDbContext context,
        TeacherStopAssignmentDto assignmentDto)
    {
        var stop = await context.Stops.Include(s => s.TeacherAssignments).FirstOrDefaultAsync(s => s.Id == assignmentDto.StopId);
        if (stop == null)
        {
            return Results.NotFound();
        }
        
        var teacher = await TeacherFunctions.GetTeacherByUsernameAsync(context, assignmentDto.EdufsUsername);
        if (teacher == null)
        {
            return Results.NotFound();
        }
        
        if (context.TeacherAssignments.Any(ta => ta.StopId == stop.Id && ta.TeacherId == teacher.EdufsUsername))
        {
            return Results.BadRequest("Stop already assigned to teacher");
        }
        stop.TeacherAssignments.Add(new TeacherAssignment()
        {
            TeacherId = teacher.EdufsUsername,
            StopId = stop.Id,
            Stop = stop,
            Teacher = teacher
        });
        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public static async Task<IResult> UnassignTeachersFromStop(TadeoTDbContext context,
        [FromRoute] int stopId)
    {
        var assignemnts = context.TeacherAssignments.Where(a => a.StopId == stopId).ToArray();
        context.TeacherAssignments.RemoveRange(assignemnts);
        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public record TeacherStopAssignmentDto(string EdufsUsername, int StopId);
}