using System.Net;
using System.Net.Http.Json;
using API.Endpoints.StopGroupManagement;
using Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace TadeoTIntegrationTests;

public class StopGroupManagementTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private const string BaseUrl = "/v1/api/groups";

    [Fact]
    public async Task GetGroups_ShouldReturnEmpty_WhenNoGroupsExist()
    {
        // Act
        var response = await Client.GetAsync(BaseUrl);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var groups = await response.Content.ReadFromJsonAsync<List<StopGroup>>();
        groups.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateGroup_ShouldReturnOk_WhenGroupIsValid()
    {
        // Arrange
        var groupDto = new StopGroupManagementEndpoints.CreateGroupRequestDto(
            "Test Group",
            "Description",
            true
        );

        // Act
        var response = await Client.PostAsJsonAsync(BaseUrl, groupDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbGroup = await DbContext.StopGroups.FirstOrDefaultAsync(g => g.Name == "Test Group");
        dbGroup.Should().NotBeNull();
        dbGroup!.IsPublic.Should().BeTrue();
    }

    [Fact]
    public async Task GetGroupById_ShouldReturnGroup_WhenGroupExists()
    {
        // Arrange
        var group = new StopGroup
        {
            Name = "Get Group",
            Description = "Desc",
            IsPublic = true,
            Order = 1
        };
        DbContext.StopGroups.Add(group);
        await DbContext.SaveChangesAsync();

        // Act
        var response = await Client.GetAsync($"{BaseUrl}/{group.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<StopGroup>();
        result.Should().NotBeNull();
        result!.Name.Should().Be("Get Group");
    }

    [Fact]
    public async Task UpdateGroup_ShouldReturnOk_WhenGroupExists()
    {
        // Arrange
        var group = new StopGroup
        {
            Name = "Old Group",
            Description = "Desc",
            IsPublic = false
        };
        DbContext.StopGroups.Add(group);
        await DbContext.SaveChangesAsync();

        var updateDto = new StopGroupManagementEndpoints.UpdateGroupRequestDto(
            group.Id,
            "New Group",
            "New Desc",
            true,
            []
        );

        // Act
        var response = await Client.PutAsJsonAsync(BaseUrl, updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbGroup = await DbContext.StopGroups.AsNoTracking().FirstAsync(g => g.Id == group.Id);
        dbGroup.Name.Should().Be("New Group");
        dbGroup.IsPublic.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteGroup_ShouldReturnOk_WhenGroupExists()
    {
        // Arrange
        var group = new StopGroup
        {
            Name = "Delete Me",
            Description = "Desc",
            IsPublic = false
        };
        DbContext.StopGroups.Add(group);
        await DbContext.SaveChangesAsync();

        // Act
        var response = await Client.DeleteAsync($"{BaseUrl}/{group.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbGroup = await DbContext.StopGroups.FirstOrDefaultAsync(g => g.Id == group.Id);
        dbGroup.Should().BeNull();
    }
}
