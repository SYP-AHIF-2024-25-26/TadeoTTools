using System.Net;
using System.Net.Http.Json;
using API.Endpoints.AdminManagement;
using Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace TadeoTIntegrationTests;

public class AdminManagementTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private const string BaseUrl = "/v1/api/admins";

    [Fact]
    public async Task GetAllAdmins_ShouldReturnList()
    {
        // Act
        var response = await Client.GetAsync(BaseUrl);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var admins = await response.Content.ReadFromJsonAsync<List<string>>(); // Returns list of IDs (strings)
        admins.Should().NotBeNull();
    }

    [Fact]
    public async Task AddAdmin_ShouldReturnOk_WhenAdminIsValid()
    {
        // Arrange
        var dto = new AdminManagementEndpoints.AddAdminDto("newadmin");

        // Act
        var response = await Client.PostAsJsonAsync(BaseUrl, dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbAdmin = await DbContext.Admins.FirstOrDefaultAsync(a => a.Id == "newadmin");
        dbAdmin.Should().NotBeNull();
    }

    [Fact]
    public async Task DeleteAdmin_ShouldReturnOk_WhenAdminExists()
    {
        // Arrange
        var admin = new Admin { Id = "deleteme" };
        DbContext.Admins.Add(admin);
        await DbContext.SaveChangesAsync();

        // Act
        var response = await Client.DeleteAsync($"{BaseUrl}/{admin.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbAdmin = await DbContext.Admins.FirstOrDefaultAsync(a => a.Id == "deleteme");
        dbAdmin.Should().BeNull();
    }
}
