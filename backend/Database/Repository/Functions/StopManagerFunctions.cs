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

    public static async Task<ImportResult> ParseStopManagerCsv(string csvData, TadeoTDbContext context)
    {
        var lines = csvData.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries);

        if (lines.Length > 0)
        {
            var header = lines[0].Split(';');
            if (header is not ["EdufsUsername", "FirstName", "LastName"])
            {
                throw new ArgumentException("Invalid CSV format");
            }

            var rows = lines.Skip(1).ToList();
            var stopManagers = rows
                .Select(line => line.Split(';'))
                .Select(cols => new StopManager
                {
                    EdufsUsername = cols[0],
                    FirstName = cols[1],
                    LastName = cols[2],
                })
                // Existing stop managers are skipped instead of failing the whole import.
                .Where(m => !context.StopManagers.Any(e => EF.Functions.ILike(e.EdufsUsername, m.EdufsUsername)))
                .ToList();

            await context.StopManagers.AddRangeAsync(stopManagers);
            await context.SaveChangesAsync();
            return new ImportResult(stopManagers.Count, rows.Count - stopManagers.Count);
        }
        else
        {
            throw new ArgumentException("CSV file is empty");
        }
    }

    public record StopManagerWithStopsDto(string EdufsUsername, string FirstName, string LastName, int[] AssignedStops);
}