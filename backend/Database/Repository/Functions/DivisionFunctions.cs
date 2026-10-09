using Microsoft.EntityFrameworkCore;

namespace Database.Repository.Functions;

public class DivisionFunctions
{
    public static async Task<List<DivisionWithoutImageDto>> GetAllDivisionsWithoutImageAsync(TadeoTDbContext context)
    {
        return await
            context.Divisions
                // A fixed order; without it Postgres returns updated rows last.
                .OrderBy(d => d.Name)
                .Select(d => new DivisionWithoutImageDto(d.Id, d.Name, d.Color))
                .ToListAsync();
    }

    public static async Task<byte[]?> GetImageOfDivision(TadeoTDbContext context, int divisionId)
    {
        return await context.Divisions
            .Where(d => d.Id == divisionId)
            .Select(d => d.Image)
            .SingleOrDefaultAsync();
    }

    public static async Task<bool> DoesDivisionExistAsync(TadeoTDbContext context, int id)
    {
        return await context.Divisions.SingleOrDefaultAsync(d => d.Id == id) != null;
    }

    public record DivisionWithoutImageDto(int Id, string Name, string Color);
}