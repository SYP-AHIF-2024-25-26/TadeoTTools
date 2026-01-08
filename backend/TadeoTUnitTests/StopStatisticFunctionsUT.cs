/*using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using TadeoT.Database.Functions;
using TadeoT.Database;
using TadeoT.Database.Model;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

namespace TadeoTUnitTests;

public class StopStatisticFunctionsTests
{
    private readonly StopStatistic testStatistic;
    private readonly StopGroup testGroup;
    private readonly Division testDivision;
    private readonly Stop testStop;

    private ServiceProvider? ServiceProvider = null;

    private static ServiceProvider BuildServiceProvider()
    {
        var services = new ServiceCollection();
        services.AddDbContext<TadeoTDbContext>(options =>
            options.UseMySql(TadeoTDbContextFactory.GetConnectionString(), ServerVersion.AutoDetect(TadeoTDbContextFactory.GetConnectionString())));

        services.AddScoped<DivisionFunctions>();
        services.AddScoped<StopGroupFunctions>();
        services.AddScoped<StopFunctions>();
        services.AddScoped<StopStatisticFunctions>();

        return services.BuildServiceProvider();
    }


    public StopStatisticFunctionsTests()
    {
        testGroup = new StopGroup()
        {
            Name = "Informatik",
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
            StopGroup = testGroup,
            Division = testDivision
        };
        testStatistic = new StopStatistic()
        {
            StopID = this.testStop.StopID,
            Stop = this.testStop,
            Time = DateTime.Now,
            IsDone = false
        };
    }

    [SetUp]
    public void Setup()
    {
        ServiceProvider = BuildServiceProvider();

        using var scope = ServiceProvider!.CreateScope();
        var divisionFunctions = scope.ServiceProvider.GetRequiredService<DivisionFunctions>();
        var stopGroupFunctions = scope.ServiceProvider.GetRequiredService<StopGroupFunctions>();
        var stopFunctions = scope.ServiceProvider.GetRequiredService<StopFunctions>();
        var stopStatisticFunction = scope.ServiceProvider.GetRequiredService<StopStatisticFunctions>();

        var context = scope.ServiceProvider.GetRequiredService<TadeoTDbContext>();
        context.Database.EnsureCreatedAsync().Wait();
        context.Divisions.ExecuteDeleteAsync().Wait();
        context.StopGroups.ExecuteDeleteAsync().Wait();
        context.Stops.ExecuteDeleteAsync().Wait();
        context.StopStatistics.ExecuteDeleteAsync().Wait();

        divisionFunctions.AddDivision(this.testDivision).Wait();
        stopGroupFunctions.AddStopGroup(this.testGroup).Wait();
        stopFunctions.AddStop(this.testStop).Wait();
        stopStatisticFunction.AddStopStatistic(this.testStatistic).Wait();
    }

    [TearDown]
    public void TearDown()
    {
        ServiceProvider?.Dispose();
    }


    [Test, Order(1)]
    public async Task AddStopStatisticTest()
    {
        using var scope = ServiceProvider!.CreateScope();
        var stopStatisticFunctions = scope.ServiceProvider.GetRequiredService<StopStatisticFunctions>();

        StopStatistic stopStatistic = new()
        {
            StopID = this.testStop.StopID,
            Stop = this.testStop,
            Time = DateTime.Now,
            IsDone = false
        };
        await stopStatisticFunctions.AddStopStatistic(stopStatistic);
        StopStatistic result = await stopStatisticFunctions.GetStopStatisticById(stopStatistic.StopStatisticID);
        Assert.That(result, Is.Not.EqualTo(null));
    }

    [Test, Order(2)]
    public async Task GetStopStatisticByIdTest()
    {
        using var scope = ServiceProvider!.CreateScope();
        var stopStatisticFunctions = scope.ServiceProvider.GetRequiredService<StopStatisticFunctions>();

        StopStatistic result = await stopStatisticFunctions.GetStopStatisticById(testStatistic.StopStatisticID);
        Assert.That(result.StopStatisticID, Is.EqualTo(testStatistic.StopStatisticID));
    }

    [Test, Order(3)]
    public async Task DeleteStopStatistic()
    {
        using var scope = ServiceProvider!.CreateScope();
        var stopStatisticFunctions = scope.ServiceProvider.GetRequiredService<StopStatisticFunctions>();

        StopStatistic stat = await stopStatisticFunctions.GetStopStatisticById(this.testStatistic.StopStatisticID);
        await stopStatisticFunctions.DeleteStopStopStatisticById(stat.StopStatisticID);
        Assert.ThrowsAsync<TadeoTNotFoundException>(async Task () => await stopStatisticFunctions.GetStopStatisticById(this.testStatistic.StopStatisticID));
    }
}

*/