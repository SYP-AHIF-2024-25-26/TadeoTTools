using Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Database.Repository.Functions;

public class TeacherFunctions
{
    public static async Task<List<TeacherWithStopsDto>> GetAllTeachersAsync(TadeoTDbContext context)
    {
        return await context.Teachers.Include(t => t.AssignedStops).Select(t =>
            new TeacherWithStopsDto(
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
    
    public static async Task ParseTeacherCsv(string csvData, TadeoTDbContext context)
    {
        var lines = csvData.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries);
        
        if (lines.Length > 0)
        {
            var header = lines[0].Split(';');
            if (header is not ["EdufsUsername", "FirstName", "LastName"])
            {
                throw new ArgumentException("Invalid CSV format");
            }

            var teachers = lines
                .Skip(1)
                .Select(line => line.Split(';'))
                .Select(cols => new Teacher
                {
                    EdufsUsername = cols[0],
                    FirstName = cols[1],
                    LastName = cols[2],
                });

            await context.Teachers.AddRangeAsync(teachers);
            await context.SaveChangesAsync();
        }
        else
        {
            throw new ArgumentException("CSV file is empty");
        }
    }
    public record TeacherWithStopsDto(string EdufsUsername, string FirstName, string LastName, int[] AssignedStops);
}