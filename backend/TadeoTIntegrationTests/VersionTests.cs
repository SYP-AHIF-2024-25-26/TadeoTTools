using System.Net;
using System.Net.Http.Json;
using API.Endpoints.VersionManagement;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Xunit;

namespace TadeoTIntegrationTests;

public class VersionTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private const string BaseUrl = "/v1/api/version";

    [Fact]
    public async Task GetVersion_ShouldReturnDev_WhenImageHasNoVersion()
    {
        var response = await Client.GetAsync(BaseUrl);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var version = await response.Content.ReadFromJsonAsync<VersionEndpoints.VersionDto>();
        version!.Version.Should().Be("dev");
    }

    [Fact]
    public async Task GetVersion_ShouldReturnImageVersion_WhenSet()
    {
        var client = Factory
            .WithWebHostBuilder(builder => builder.UseSetting("APP_VERSION", "1.2.3"))
            .CreateClient();

        var version = await client.GetFromJsonAsync<VersionEndpoints.VersionDto>(BaseUrl);

        version!.Version.Should().Be("1.2.3");
    }
}
