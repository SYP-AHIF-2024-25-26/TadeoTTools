using Database;
using Database.Repository;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace TadeoTIntegrationTests;

public abstract class BaseIntegrationTest : IClassFixture<IntegrationTestWebAppFactory>, IAsyncLifetime
{
    private readonly IServiceScope _scope;
    protected readonly IntegrationTestWebAppFactory Factory;
    protected readonly HttpClient Client;
    protected readonly TadeoTDbContext DbContext;

    protected BaseIntegrationTest(IntegrationTestWebAppFactory factory)
    {
        Factory = factory;
        Client = factory.CreateClient();
        _scope = factory.Services.CreateScope();
        DbContext = _scope.ServiceProvider.GetRequiredService<TadeoTDbContext>();
    }

    public async Task InitializeAsync()
    {
        await DbContext.Database.EnsureCreatedAsync();
        // Clear data relative to the test if necessary, or rely on EnsureCreated/Deleted
    }

    public async Task DisposeAsync()
    {
        await DbContext.Database.EnsureDeletedAsync();
        _scope.Dispose();
    }
}
