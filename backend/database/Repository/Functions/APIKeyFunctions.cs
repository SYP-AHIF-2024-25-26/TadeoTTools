using Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Database.Repository.Functions;

public class APIKeyFunctions(TadeoTDbContext context)
{
    private readonly TadeoTDbContext context = context;

    public async Task<List<APIKey>> GetAllAPIKeys()
    {
        return await context.APIKeys.ToListAsync();
    }

    public async Task<APIKey> AddAPIKey(APIKey apiKey)
    {
        context.APIKeys.Add(apiKey);
        await context.SaveChangesAsync();
        return apiKey;
    }

    public async Task DeleteAPIKey(APIKey apiKey)
    {
        context.APIKeys.Remove(apiKey);
        await context.SaveChangesAsync();
    }
}
