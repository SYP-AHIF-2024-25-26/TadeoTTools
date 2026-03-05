using Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Database.Repository.Functions;

public class StopManagerFunctions
{
    public static async Task<List<StopManagerWithStopsDto>> GetAllStopManagersAsync(TadeoTDbContext context)
    {
        return await context.StopManagers.Include(t => t.AssignedStops).Select(t =>
            new StopManagerWithStopsDto(
                t.EdufsUsername,
                t.FirstName,
                t.LastName,
                t.AssignedStops.Select(a => a.StopId).ToArray()
            )
        ).ToListAsync();
    }

    public static async Task<StopManager?> GetStopManagerByUsernameAsync(TadeoTDbContext context, string edufsUsername)
    {
        return await context.StopManagers
            .Include(t => t.AssignedStops)
            .Where(t => EF.Functions.ILike(t.EdufsUsername, edufsUsername))
            .FirstOrDefaultAsync();
    }

    public static async Task ParseStopManagerCsv(string csvData, TadeoTDbContext context)
    {
        var lines = csvData.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries);

        if (lines.Length > 0)
        {
            var header = lines[0].Split(';');
            if (header is not ["EdufsUsername", "FirstName", "LastName"])
            {
                throw new ArgumentException("Invalid CSV format");
            }

            var stopManagers = lines
                .Skip(1)
                .Select(line => line.Split(';'))
                .Select(cols => new StopManager
                {
                    EdufsUsername = cols[0],
                    FirstName = cols[1],
                    LastName = cols[2],
                });

            await context.StopManagers.AddRangeAsync(stopManagers);
            await context.SaveChangesAsync();
        }
        else
        {
            throw new ArgumentException("CSV file is empty");
        }
    }

    public record StopManagerWithStopsDto(string EdufsUsername, string FirstName, string LastName, int[] AssignedStops);
}