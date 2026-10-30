using API.Endpoints.RegistrationManagement;
using Database;
using Database.Repository;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Testcontainers.PostgreSql;
using Xunit;

namespace TadeoTIntegrationTests;

public class IntegrationTestWebAppFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder()
        .WithImage("postgres:15-alpine")
        .WithDatabase("tadeot_test_db")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public VisitorPhotoStore Photos { get; } =
        new(Path.Combine(Path.GetTempPath(), "tadeot-test-photos", Guid.NewGuid().ToString("N")));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType ==
                     typeof(DbContextOptions<TadeoTDbContext>));

            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<TadeoTDbContext>(options =>
            {
                options.UseNpgsql(_dbContainer.GetConnectionString());
            });

            services.AddSingleton<IPolicyEvaluator, FakePolicyEvaluator>();

            // Photos go to a temporary folder of this factory, not into the API project.
            services.RemoveAll<VisitorPhotoStore>();
            services.AddSingleton(Photos);
        });
    }

    public async Task InitializeAsync()
    {
        await _dbContainer.StartAsync();
    }

    public new async Task DisposeAsync()
    {
        await _dbContainer.StopAsync();
        Directory.Delete(Photos.Folder, recursive: true);
    }
}
