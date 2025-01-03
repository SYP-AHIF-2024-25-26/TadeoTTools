using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TadeoT.Database.Functions;
using TadeoT.Database;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Core.Entities;

[assembly: NonParallelizable]

namespace TadeoTUnitTests;

[TestFixture]
public class DivisionFunctionsUT
{
    private readonly Division testDivision;

    private ServiceProvider? ServiceProvider = null;

    private static ServiceProvider BuildServiceProvider()
    {
        var services = new ServiceCollection();
        services.AddDbContext<TadeoTDbContext>(options =>
            options.UseMySql(TadeoTDbContextFactory.GetConnectionString(), ServerVersion.AutoDetect(TadeoTDbContextFactory.GetConnectionString())));
        services.AddScoped<DivisionFunctions>();

        return services.BuildServiceProvider();
    }

    [SetUp]
    public void Setup()
    {
        ServiceProvider = BuildServiceProvider();

        using var scope = ServiceProvider!.CreateScope();
        var divisionFunctions = scope.ServiceProvider.GetRequiredService<DivisionFunctions>();

        var context = scope.ServiceProvider.GetRequiredService<TadeoTDbContext>();
        context.Database.EnsureCreatedAsync().Wait();
        context.Divisions.ExecuteDeleteAsync().Wait();

        divisionFunctions.AddDivision(this.testDivision).Wait();
    }

    [TearDown]
    public void TearDown()
    {
        ServiceProvider?.Dispose();
    }

    public DivisionFunctionsUT()
    {
        this.testDivision = new Division()
        {
            Name = "TestDivision",
            Color = "#FFFFFF"
        };
    }

    [Test]
    public async Task AddDivisionTest()
    {
        using var scope = ServiceProvider!.CreateScope();
        var divisionFunctions = scope.ServiceProvider.GetRequiredService<DivisionFunctions>();

        Division division = new()
        {
            Name = "TestDivision",
            Color = "#FFFFFF"
        };

        await divisionFunctions.AddDivision(division);
        Division result = await divisionFunctions.GetDivisionById(division.DivisionID);
        Assert.That(result, Is.Not.EqualTo(null));
    }

    [Test]
    public async Task GetDivisionByIdTest()
    {
        using var scope = ServiceProvider!.CreateScope();
        var divisionFunctions = scope.ServiceProvider.GetRequiredService<DivisionFunctions>();
        Division result = await divisionFunctions.GetDivisionById(testDivision.DivisionID);
        Assert.That(result.DivisionID, Is.EqualTo(testDivision.DivisionID));
    }

    [Test]
    public async Task UpdateDivisionTest()
    {
        using var scope = ServiceProvider!.CreateScope();
        var divisionFunctions = scope.ServiceProvider.GetRequiredService<DivisionFunctions>();
        Division division = await divisionFunctions.GetDivisionById(this.testDivision.DivisionID);
        division.Name = "Elektronik";
        await divisionFunctions.UpdateDivision(division);
        Division result = await divisionFunctions.GetDivisionById(this.testDivision.DivisionID);
        Assert.That(result.Name, Is.EqualTo("Elektronik"));
    }

    [Test]
    public async Task DeleteDivisionTest()
    {
        using var scope = ServiceProvider!.CreateScope();
        var divisionFunctions = scope.ServiceProvider.GetRequiredService<DivisionFunctions>();
        Division division = await divisionFunctions.GetDivisionById(this.testDivision.DivisionID);
        await divisionFunctions.DeleteDivisionById(division.DivisionID);
        Assert.ThrowsAsync<TadeoTNotFoundException>(async Task () =>
            await divisionFunctions.GetDivisionById(this.testDivision.DivisionID));
    }
}

