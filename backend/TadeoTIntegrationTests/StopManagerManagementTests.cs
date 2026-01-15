using System.Net;
using System.Net.Http.Json;
using API.Endpoints.StopManagerManagement;
using Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace TadeoTIntegrationTests;

public class StopManagerManagementTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private const string BaseUrl = "/v1/api/stopmanagers";

    [Fact]
    public async Task GetAllStopManagers_ShouldReturnList()
    {
        // Act
        var response = await Client.GetAsync(BaseUrl);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var managers = await response.Content.ReadFromJsonAsync<List<object>>();
        managers.Should().NotBeNull();
    }

    [Fact]
    public async Task AddStopManager_ShouldReturnCreated_WhenValid()
    {
        // Arrange
        var dto = new StopManagerManagementEndpoints.AddStopManagerDto("tuser", "Test", "User");

        // Act
        var response = await Client.PostAsJsonAsync(BaseUrl, dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var dbManager = await DbContext.StopManagers.FirstOrDefaultAsync(m => m.EdufsUsername == "tuser");
        dbManager.Should().NotBeNull();
        dbManager!.FirstName.Should().Be("Test");
    }

    [Fact]
    public async Task GetStopManagerById_ShouldReturnManager_WhenExists()
    {
        // Arrange
        var manager = new StopManager { EdufsUsername = "getuser", FirstName = "Get", LastName = "User" };
        DbContext.StopManagers.Add(manager);
        await DbContext.SaveChangesAsync();

        // Act
        var response = await Client.GetAsync($"{BaseUrl}/{manager.EdufsUsername}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        // We might need to deserialize specific DTO, but checking status is a good start. 
        // DTO is StopManagerWithStopsDto which is nested in StopManagerFunctions.
    }

    [Fact]
    public async Task UpdateStopManager_ShouldReturnOk_WhenExists()
    {
        // Arrange
        var manager = new StopManager { EdufsUsername = "updateuser", FirstName = "Old", LastName = "User" };
        DbContext.StopManagers.Add(manager);
        await DbContext.SaveChangesAsync();

        var dto = new StopManagerManagementEndpoints.AddStopManagerDto("updateuser", "New", "Name");

        // Act
        var response = await Client.PutAsJsonAsync(BaseUrl, dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbManager = await DbContext.StopManagers.AsNoTracking().FirstAsync(m => m.EdufsUsername == "updateuser");
        dbManager.FirstName.Should().Be("New");
        dbManager.LastName.Should().Be("Name");
    }

    [Fact]
    public async Task DeleteStopManager_ShouldReturnOk_WhenExists()
    {
        // Arrange
        var manager = new StopManager { EdufsUsername = "deleteuser", FirstName = "Delete", LastName = "User" };
        DbContext.StopManagers.Add(manager);
        await DbContext.SaveChangesAsync();

        // Act
        var response = await Client.DeleteAsync($"{BaseUrl}/{manager.EdufsUsername}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbManager = await DbContext.StopManagers.FirstOrDefaultAsync(m => m.EdufsUsername == "deleteuser");
        dbManager.Should().BeNull();
    }
}
