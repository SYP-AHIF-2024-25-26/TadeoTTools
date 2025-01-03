using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Database.Repository;

public class TadeoTDbContextFactory
{
    public static TadeoTDbContext CreateDbContext()
    {
        var optionsBuilder = new DbContextOptionsBuilder<TadeoTDbContext>();
        optionsBuilder.UseMySql(GetConnectionString(), ServerVersion.AutoDetect(GetConnectionString()));

        return new TadeoTDbContext(optionsBuilder.Options);
    }
    public static string GetConnectionString()
    {
        var config = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json")
            .Build();

        var serverName = config["Database:ServerName"];
        var serverPort = config["Database:Port"];
        var databaseName = config["Database:Name"];
        var username = config["Database:User"];
        var password = config["Database:Password"];

        return $"Server={serverName};Port={serverPort};Database={databaseName};User={username};Password={password};";
    }
}
