/*using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TadeoT.Database;
using TadeoT.Database.Functions;
using TadeoT.Database.Model;


namespace TadeoTUnitTests;

public class StopFunctionsUT
{
    private readonly StopGroup testGroup;
    private readonly Stop testStop;
    private readonly Division testDivision;

    public StopFunctionsUT()
    {
        testGroup = new StopGroup()
        {
            Name = "TestGroup",
            Description = "TestDescription",
            IsPublic = true
        };

        testDivision = new Division()
        {
            Name = "TestDivision",
            Color = "#FFFFFF"
        };

        testStop = new Stop()
        {
            Name = "TestStop",
            Description = "TestDescription",
            RoomNr = "E72",
            Division = testDivision,
            StopGroup = testGroup
        };
    }

    private ServiceProvider? ServiceProvider = null;

    private static ServiceProvider BuildServiceProvider()
    {
        var services = new ServiceCollection();
        services.AddDbContext<TadeoTDbContext>(options =>
            options.UseMySql(TadeoTDbContextFactory.GetConnectionString(), ServerVersion.AutoDetect(TadeoTDbContextFactory.GetConnectionString())));
        services.AddScoped<DivisionFunctions>();
        services.AddScoped<StopGroupFunctions>();
        services.AddScoped<StopFunctions>();

        return services.BuildServiceProvider();
    }

    [SetUp]
    public void Setup()
    {
        ServiceProvider = BuildServiceProvider();

        using var scope = ServiceProvider!.CreateScope();
        var divisionFunctions = scope.ServiceProvider.GetRequiredService<DivisionFunctions>();
        var stopGroupFunctions = scope.ServiceProvider.GetRequiredService<StopGroupFunctions>();
        var stopFunctions = scope.ServiceProvider.GetRequiredService<StopFunctions>();

        var context = scope.ServiceProvider.GetRequiredService<TadeoTDbContext>();
        context.Database.EnsureCreatedAsync().Wait();
        context.Divisions.ExecuteDeleteAsync().Wait();
        context.StopGroups.ExecuteDeleteAsync().Wait();
        context.Stops.ExecuteDeleteAsync().Wait();

        stopGroupFunctions.AddStopGroup(this.testGroup).Wait();
        divisionFunctions.AddDivision(this.testDivision).Wait();
        stopFunctions.AddStop(this.testStop).Wait();
    }

    [TearDown]
    public void TearDown()
    {
        ServiceProvider?.Dispose();
    }

    [Test, Order(1)]
    public async Task AddStopTest()
    {
        using var scope = ServiceProvider!.CreateScope();
        var stopFunctions = scope.ServiceProvider.GetRequiredService<StopFunctions>();

        Stop stop = new()
        {
            Name = "add stop",
            Description = "TestDescription",
            RoomNr = "E72",
            StopGroup = this.testGroup,
            Division = this.testDivision
        };

        await stopFunctions.AddStop(stop);
        Stop result = await stopFunctions.GetStopById(stop.StopID);
        Assert.That(result, Is.Not.EqualTo(null));
    }

    [Test, Order(2)]
    public async Task GetStopByIdTest()
    {
        using var scope = ServiceProvider!.CreateScope();
        var stopFunctions = scope.ServiceProvider.GetRequiredService<StopFunctions>();
        Stop result = await stopFunctions.GetStopById(testStop.StopID);
        Assert.That(result.StopID, Is.EqualTo(testStop.StopID));
    }

    [Test, Order(3)]
    public async Task UpdateStopTest()
    {
        using var scope = ServiceProvider!.CreateScope();
        var stopFunctions = scope.ServiceProvider.GetRequiredService<StopFunctions>();

        Stop stop = await stopFunctions.GetStopById(this.testStop.StopID);
        stop.Name = "UpdatedName";
        await stopFunctions.UpdateStop(stop);
        Stop result = await stopFunctions.GetStopById(this.testStop.StopID);
        Assert.That(result.Name, Is.EqualTo("UpdatedName"));
    }

    [Test, Order(4)]
    public async Task DeleteStop()
    {
        using var scope = ServiceProvider!.CreateScope();
        var stopFunctions = scope.ServiceProvider.GetRequiredService<StopFunctions>();

        Stop stop = await stopFunctions.GetStopById(this.testStop.StopID);
        await stopFunctions.DeleteStopById(stop.StopID);
        Assert.ThrowsAsync<TadeoTNotFoundException>(async Task () => await stopFunctions.GetStopById(stop.StopID));
    }

    [Test, Order(5)]
    public async Task MoveStopUp() // only works if next one isn't higher than 1
    {
        using var scope = ServiceProvider!.CreateScope();
        var stopFunctions = scope.ServiceProvider.GetRequiredService<StopFunctions>();

        Stop stop = await stopFunctions.GetStopById(this.testStop.StopID);
        await stopFunctions.MoveStopUp(stop.StopID);
        Stop result = await stopFunctions.GetStopById(this.testStop.StopID);
        Assert.That(result.StopOrder, Is.EqualTo(1));
    }

    [Test, Order(6)]
    public async Task MoveStopDown() // only works if last one isn't lower than 0
    {
        using var scope = ServiceProvider!.CreateScope();
        var stopFunctions = scope.ServiceProvider.GetRequiredService<StopFunctions>();

        Stop stop = await stopFunctions.GetStopById(this.testStop.StopID);
        await stopFunctions.MoveStopDown(stop.StopID);
        Stop result = await stopFunctions.GetStopById(this.testStop.StopID);
        Assert.That(result.StopOrder, Is.EqualTo(-1));
    }
}
*/