using Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Database.Repository.Functions;

public class TeacherFunctions(TadeoTDbContext context)
{
    public async Task<List<Teacher>> GetAllTeachers()
    {
        return await context.Teachers.ToListAsync();
    }

    public async Task<Teacher?> GetTeacherByUsername(string edufsUsername)
    {
        return await context.Teachers
            .Where(t => t.EdufsUsername == edufsUsername)
            .FirstOrDefaultAsync();
    }
    
    
}