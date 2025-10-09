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
        if (!string.IsNullOrEmpty(connectionString))
        {
            return connectionString;
        }

        var serverName = config["Database:ServerName"];
        var serverPort = config["Database:Port"];
        var databaseName = config["Database:Name"];
        var username = config["Database:User"];
        var password = config["Database:Password"];

        Console.WriteLine(
            $"Server={serverName};Port={serverPort};Database={databaseName};User={username};Password={password};");
        return $"Server={serverName};Port={serverPort};Database={databaseName};User={username};Password={password};";
    }

    public TadeoTDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<TadeoTDbContext>();
        optionsBuilder.UseMySQL(GetConnectionString());

        return new TadeoTDbContext(optionsBuilder.Options);
    }
}