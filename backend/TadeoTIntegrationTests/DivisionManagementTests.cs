using System.Net;
using System.Net.Http.Json;
using API.Endpoints.DivisionManagement;
using Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace TadeoTIntegrationTests;

public class DivisionManagementTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private const string BaseUrl = "/v1/api/divisions";

    [Fact]
    public async Task GetDivisions_ShouldReturnList()
    {
        // Act
        var response = await Client.GetAsync("/v1/divisions"); // Note: URL is /v1/divisions in API definition

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var divisions = await response.Content.ReadFromJsonAsync<List<object>>();
        divisions.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateDivision_ShouldReturnOk_WhenValid()
    {
        // Arrange
        var dto = new DivisionManagementEndpoints.AddDivisionDto("Test Div", "#FF0000");

        // Act
        var response = await Client.PostAsJsonAsync(BaseUrl, dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbDiv = await DbContext.Divisions.FirstOrDefaultAsync(d => d.Name == "Test Div");
        dbDiv.Should().NotBeNull();
        dbDiv!.Color.Should().Be("#FF0000");
    }

    [Fact]
    public async Task UpdateDivision_ShouldReturnOk_WhenExists()
    {
        // Arrange
        var div = new Division { Name = "Old Div", Color = "#00FF00" };
        DbContext.Divisions.Add(div);
        await DbContext.SaveChangesAsync();

        var dto = new DivisionManagementEndpoints.UpdateDivisionDto(div.Id, "New Div", "#0000FF");

        // Act
        var response = await Client.PutAsJsonAsync(BaseUrl, dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbDiv = await DbContext.Divisions.AsNoTracking().FirstAsync(d => d.Id == div.Id);
        dbDiv.Name.Should().Be("New Div");
        dbDiv.Color.Should().Be("#0000FF");
    }

    [Fact]
    public async Task DeleteDivision_ShouldReturnOk_WhenExists()
    {
        // Arrange
        var div = new Division { Name = "Delete Div", Color = "#FFFFFF" };
        DbContext.Divisions.Add(div);
        await DbContext.SaveChangesAsync();

        // Act
        var response = await Client.DeleteAsync($"{BaseUrl}/{div.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbDiv = await DbContext.Divisions.FirstOrDefaultAsync(d => d.Id == div.Id);
        dbDiv.Should().BeNull();
    }
}
