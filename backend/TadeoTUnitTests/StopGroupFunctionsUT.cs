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

public class StopGroupFunctionsTests
{
    private readonly StopGroup testGroup;

    private ServiceProvider? ServiceProvider = null;

    private static ServiceProvider BuildServiceProvider()
    {
        var services = new ServiceCollection();
        services.AddDbContext<TadeoTDbContext>(options =>
            options.UseMySql(TadeoTDbContextFactory.GetConnectionString(), ServerVersion.AutoDetect(TadeoTDbContextFactory.GetConnectionString())));
        services.AddScoped<StopGroupFunctions>();

        return services.BuildServiceProvider();
    }



    [SetUp]
    public void Setup()
    {
        ServiceProvider = BuildServiceProvider();

        using var scope = ServiceProvider!.CreateScope();
        var stopGroupFunctions = scope.ServiceProvider.GetRequiredService<StopGroupFunctions>();

        var context = scope.ServiceProvider.GetRequiredService<TadeoTDbContext>();
        context.Database.EnsureCreatedAsync().Wait();
        context.StopGroups.ExecuteDeleteAsync().Wait();

        stopGroupFunctions.AddStopGroup(this.testGroup).Wait();
    }

    [TearDown]
    public void TearDown()
    {
        ServiceProvider?.Dispose();
    }

    public StopGroupFunctionsTests()
    {
        this.testGroup = new StopGroup()
        {
            Name = "TestName",
            Description = "TestDescription",
            IsPublic = true
        };
    }

    [Test, Order(1)]
    public async Task AddStopGroupTest()
    {
        using var scope = ServiceProvider!.CreateScope();
        var stopGroupFunctions = scope.ServiceProvider.GetRequiredService<StopGroupFunctions>();

        StopGroup group = new()
        {
            Name = "TestName",
            Description = "TestDescription",
            IsPublic = true
        };


        await stopGroupFunctions.AddStopGroup(group);
        StopGroup result = await stopGroupFunctions.GetStopGroupById(group.StopGroupID);
        Assert.That(result, Is.Not.EqualTo(null));
    }

    [Test, Order(2)]
    public async Task GetStopGroupByIdTest()
    {
        using var scope = ServiceProvider!.CreateScope();
        var stopGroupFunctions = scope.ServiceProvider.GetRequiredService<StopGroupFunctions>();

        StopGroup result = await stopGroupFunctions.GetStopGroupById(testGroup.StopGroupID);
        Assert.That(result.StopGroupID, Is.EqualTo(testGroup.StopGroupID));
    }

    [Test, Order(3)]
    public async Task UpdateStopGroupTest()
    {
        using var scope = ServiceProvider!.CreateScope();
        var stopGroupFunctions = scope.ServiceProvider.GetRequiredService<StopGroupFunctions>();

        StopGroup group = await stopGroupFunctions.GetStopGroupById(this.testGroup.StopGroupID);
        group.Name = "Elektronik";
        await stopGroupFunctions.UpdateStopGroup(group);
        StopGroup result = await stopGroupFunctions.GetStopGroupById(this.testGroup.StopGroupID);
        Assert.That(result.Name, Is.EqualTo("Elektronik"));
    }

    [Test, Order(4)]
    public async Task DeleteStopGroup()
    {
        using var scope = ServiceProvider!.CreateScope();
        var stopGroupFunctions = scope.ServiceProvider.GetRequiredService<StopGroupFunctions>();

        StopGroup group = await stopGroupFunctions.GetStopGroupById(this.testGroup.StopGroupID);
        await stopGroupFunctions.DeleteStopGroupById(group.StopGroupID);
        Assert.ThrowsAsync<TadeoTNotFoundException>(async Task () => await stopGroupFunctions.GetStopGroupById(this.testGroup.StopGroupID));
    }

    [Test, Order(5)]
    public async Task MoveStopGroupUp() // only works if next item isn't higher than 1
    {
        using var scope = ServiceProvider!.CreateScope();
        var stopGroupFunctions = scope.ServiceProvider.GetRequiredService<StopGroupFunctions>();

        StopGroup group = await stopGroupFunctions.GetStopGroupById(this.testGroup.StopGroupID);
        await stopGroupFunctions.MoveStopGroupUp(group.StopGroupID);
        StopGroup result = await stopGroupFunctions.GetStopGroupById(this.testGroup.StopGroupID);
        Assert.That(result.StopGroupOrder, Is.EqualTo(1));
    }

    [Test, Order(6)]
    public async Task MoveStopGroupDown() // only works if previous item isn't lower than 0
    {
        using var scope = ServiceProvider!.CreateScope();
        var stopGroupFunctions = scope.ServiceProvider.GetRequiredService<StopGroupFunctions>();

        StopGroup group = await stopGroupFunctions.GetStopGroupById(this.testGroup.StopGroupID);
        await stopGroupFunctions.MoveStopGroupDown(group.StopGroupID);
        StopGroup result = await stopGroupFunctions.GetStopGroupById(this.testGroup.StopGroupID);
        Assert.That(result.StopGroupOrder, Is.EqualTo(-1));
    }
}
*/