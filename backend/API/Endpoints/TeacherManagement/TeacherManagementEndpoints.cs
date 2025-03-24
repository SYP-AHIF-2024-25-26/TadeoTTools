using Database.Repository;
using Database.Repository.Functions;

namespace API.Endpoints.TeacherManagement;

public static class TeacherManagementEndpoints
{
    public static async Task<IResult> GetAllTeachers(TadeoTDbContext context)
    {
        return Results.Ok(await TeacherFunctions.GetAllTeachersAsync(context));
    }
    
    public static async Task<IResult> AssignStopToTeacher(TadeoTDbContext context, TeacherStopAssignmentDto assignmentDto)
    {
        var teacher = await TeacherFunctions.GetTeacherByUsernameAsync(context, assignmentDto.edufsUsername);
        if (teacher == null)
        {
            return Results.NotFound();
        }

        var stop = await context.Stops.FindAsync(assignmentDto.StopId);
        if (stop == null)
        {
            return Results.NotFound();
        }
        teacher.AssignedStops.Add(stop);
        
        await context.SaveChangesAsync();
        return Results.Ok();
    }
    
    public static async Task<IResult> UnassignStopToTeacher(TadeoTDbContext context, TeacherStopAssignmentDto assignmentDto)
    {
        var teacher = await TeacherFunctions.GetTeacherByUsernameAsync(context, assignmentDto.edufsUsername);
        if (teacher == null)
        {
            return Results.NotFound();
        }

        var stop = await context.Stops.FindAsync(assignmentDto.StopId);
        if (stop == null)
        {
            return Results.NotFound();
        }

        if (teacher.AssignedStops.Contains(stop))
        {
            teacher.AssignedStops.Remove(stop);
        }
        
        await context.SaveChangesAsync();
        return Results.Ok();
    }
    
    public record TeacherStopAssignmentDto(string edufsUsername, int StopId);
}