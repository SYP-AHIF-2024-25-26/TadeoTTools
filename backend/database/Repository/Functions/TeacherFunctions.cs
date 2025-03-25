using Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Database.Repository.Functions;

public class TeacherFunctions(TadeoTDbContext context)
{
    public static async Task<List<TeacherWithoutStopsDto>> GetAllTeachersAsync(TadeoTDbContext context)
    {
        return await context.Teachers.Select(t => 
            new TeacherWithoutStopsDto (
                t.EdufsUsername, 
                t.FirstName, 
                t.LastName)
        ).ToListAsync();
    }

    public static async Task<Teacher?> GetTeacherByUsernameAsync(TadeoTDbContext context, string edufsUsername)
    {
        return await context.Teachers
            .Where(t => t.EdufsUsername == edufsUsername)
            .FirstOrDefaultAsync();
    }
    
    public record TeacherWithoutStopsDto(string EdufsUsername, string FirstName, string LastName);
}