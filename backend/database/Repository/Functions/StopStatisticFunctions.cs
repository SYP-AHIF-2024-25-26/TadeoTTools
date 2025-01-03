using Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Database.Repository.Functions;

// TODO: refactor (in a later sprint)
public class StopStatisticFunctions(TadeoTDbContext context)
{
    private readonly TadeoTDbContext context = context;

    public async Task<List<StopStatistic>> GetAllStopStatistics()
    {
        return await context.StopStatistics.ToListAsync();
    }
}
