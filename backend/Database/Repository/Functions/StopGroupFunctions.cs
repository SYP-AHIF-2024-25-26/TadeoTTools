using Microsoft.EntityFrameworkCore;

namespace Database.Repository.Functions;

public class StopGroupFunctions
{
    public static async Task<StopGroupWithStops[]> GetAllStopGroupsAsync(TadeoTDbContext context)
    {
        return await context.StopGroups
            .Select(g => new StopGroupWithStops(
                g.Id,
                g.Name,
                g.Description,
                g.Rank,
                g.IsPublic,
                context.StopGroupAssignments
                    .Where(a => a.StopGroupId == g.Id)
                    .OrderBy(a => a.Order)
                    .Select(a => a.StopId)
                    .ToArray()
            )).ToArrayAsync();
    }


    public static async Task<StopGroupWithStopsPublic[]> GetPublicStopGroupsAsync(TadeoTDbContext context)
    {
        return await context.StopGroups
            .Where(g => g.IsPublic)
            .Select(g => new StopGroupWithStopsPublic(
                g.Id,
                g.Name,
                g.Description,
                g.Rank,
                context.StopGroupAssignments
                    .Where(a => a.StopGroupId == g.Id)
                    .OrderBy(a => a.Order)
                    .Select(a => a.StopId).ToArray()
            )).ToArrayAsync();
    }

    public static async Task<bool> DoesStopGroupExistAsync(TadeoTDbContext context, int id)
    {
        return await context.StopGroups.SingleOrDefaultAsync(sg => sg.Id == id) != null;
    }

    public record StopGroupWithStops(int Id, string Name, string Description, int Rank, bool IsPublic, int[] StopIds);

    public record StopGroupWithStopsPublic(int Id, string Name, string Description, int Rank, int[] StopIds);
}