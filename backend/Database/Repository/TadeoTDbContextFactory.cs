using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Database.Repository;

public class TadeoTDbContextFactory : IDesignTimeDbContextFactory<TadeoTDbContext>
{
    private static string GetConnectionString()
    {
        var config = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json")
            .Build();

        var connectionString = config.GetConnectionString("DefaultConnection");
        return !string.IsNullOrEmpty(connectionString) ? connectionString 
            : throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
    }

    public TadeoTDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<TadeoTDbContext>();
        optionsBuilder.UseNpgsql(GetConnectionString());

        return new TadeoTDbContext(optionsBuilder.Options);
    }
}