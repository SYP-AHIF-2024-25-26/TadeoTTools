using Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Database.Repository.Functions;

public class TeacherFunctions(TadeoTDbContext context)
{
    public static async Task<List<TeacherWithStopsDto>> GetAllTeachersAsync(TadeoTDbContext context)
    {
        return await context.Teachers.Select(t => 
            new TeacherWithStopsDto (
                t.EdufsUsername, 
                t.FirstName, 
                t.LastName,
                t.AssignedStops.Select(a => a.StopId).ToArray()
                )
        ).ToListAsync();
    }

    public static async Task<Teacher?> GetTeacherByUsernameAsync(TadeoTDbContext context, string edufsUsername)
    {
        return await context.Teachers
            .Include(t => t.AssignedStops)
            .Where(t => t.EdufsUsername == edufsUsername)
            .FirstOrDefaultAsync();
    }
    
    public record TeacherWithStopsDto(string EdufsUsername, string FirstName, string LastName, int[] StopAssignments);
    public record TeacherAssignment(int StopId, Status Status);
}