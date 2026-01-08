using System.Net;
using System.Net.Http.Json;
using API.Endpoints.StopManagement;
using Database.Entities;
using Database.Repository.Functions;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace TadeoTIntegrationTests;

public class StopManagementTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private const string BaseUrl = "/v1/api/stops";

    [Fact]
    public async Task GetAllStops_ShouldReturnEmptyList_WhenNoStopsExist()
    {
        // Act
        var response = await Client.GetAsync(BaseUrl);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var stops = await response.Content.ReadFromJsonAsync<List<StopWithAssignmentsAndDivisionsDto>>();
        stops.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateStop_ShouldReturnOk_WhenStopIsValid()
    {
        // Arrange
        var stopDto = new StopManagementEndpoints.CreateStopRequestDto(
            "Test Stop",
            "Description",
            "1.01",
            [],
            [],
            [],
            []
        );

        // Act
        var response = await Client.PostAsJsonAsync(BaseUrl, stopDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbStop = await DbContext.Stops.FirstOrDefaultAsync(s => s.Name == "Test Stop");
        dbStop.Should().NotBeNull();
        dbStop!.RoomNr.Should().Be("1.01");
    }

    [Fact]
    public async Task GetStopById_ShouldReturnStop_WhenStopExists()
    {
        // Arrange
        var stop = new Stop
        {
            Name = "Get Stop",
            Description = "Desc",
            RoomNr = "2.02" // Removed UniqueId
        };
        DbContext.Stops.Add(stop);
        await DbContext.SaveChangesAsync();

        // Act
        var response = await Client.GetAsync($"{BaseUrl}/{stop.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<StopWithEverythingDto>();
        result.Should().NotBeNull();
        result!.Name.Should().Be("Get Stop");
    }

    [Fact]
    public async Task UpdateStop_ShouldReturnOk_WhenStopExists()
    {
        // Arrange
        var stop = new Stop
        {
            Name = "Old Name",
            Description = "Desc",
            RoomNr = "3.03" // Removed UniqueId
        };
        DbContext.Stops.Add(stop);
        await DbContext.SaveChangesAsync();

        var updateDto = new StopManagementEndpoints.UpdateStopRequestDto(
            stop.Id,
            "New Name",
            "New Desc",
            "3.03",
            [],
            [],
            [],
            []
        );

        // Act
        var response = await Client.PutAsJsonAsync(BaseUrl, updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbStop = await DbContext.Stops.AsNoTracking().FirstAsync(s => s.Id == stop.Id);
        dbStop.Name.Should().Be("New Name");
    }

    [Fact]
    public async Task DeleteStop_ShouldReturnOk_WhenStopExists()
    {
        // Arrange
        var stop = new Stop
        {
            Name = "Delete Me",
            Description = "Desc",
            RoomNr = "4.04" // Removed UniqueId
        };
        DbContext.Stops.Add(stop);
        await DbContext.SaveChangesAsync();

        // Act
        var response = await Client.DeleteAsync($"{BaseUrl}/{stop.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbStop = await DbContext.Stops.FirstOrDefaultAsync(s => s.Id == stop.Id);
        dbStop.Should().BeNull();
    }
}

