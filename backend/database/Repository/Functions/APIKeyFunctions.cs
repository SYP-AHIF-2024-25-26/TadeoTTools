using Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Database.Repository.Functions;

public class ApiKeyFunctions(TadeoTDbContext context)
{
    public async Task<List<APIKey>> GetAllApiKeys()
    {
        return await context.ApiKeys.ToListAsync();
    }
    
    public async Task<APIKey> AddApiKey(APIKey apiKey)
    {
        context.ApiKeys.Add(apiKey);
        await context.SaveChangesAsync();
        return apiKey;
    }
    
    public async Task DeleteApiKey(APIKey apiKey)
    {
        context.ApiKeys.Remove(apiKey);
        await context.SaveChangesAsync();
    }
}
