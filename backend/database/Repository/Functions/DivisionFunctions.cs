using Microsoft.EntityFrameworkCore;

namespace Database.Repository.Functions;
public class DivisionFunctions
{
    public record DivisionWithoutImageDto(int Id, string Name, string Color);
    public record DivisionWithImageDto(int Id, string Name, byte[]? Image);

    public static async Task<List<DivisionWithoutImageDto>> GetAllDivisionsWithoutImageAsync(TadeoTDbContext context)
    {
        return await
            context.Divisions
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
}
