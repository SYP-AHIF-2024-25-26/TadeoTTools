using Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Database.Repository.Functions;

public class StudentFunctions(TadeoTDbContext context)
{
    public async Task<List<Student>> GetAllStudents()
    {
        return await context.Students.ToListAsync();
    }

    public async Task<Student?> GetStudentByEdufsUsername(string edufsUsername)
    {
        return await context.Students
            .FirstOrDefaultAsync(s => s.EdufsUsername == edufsUsername);
    }
    
    
}