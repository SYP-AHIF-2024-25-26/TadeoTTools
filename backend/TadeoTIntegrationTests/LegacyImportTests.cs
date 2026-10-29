using System.Net;
using System.Net.Http.Json;
using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Xunit;
using static API.Endpoints.BuffetManagement.BuffetEndpoints;
using static API.Endpoints.LegacyImportManagement.LegacyImportEndpoints;

namespace TadeoTIntegrationTests;

public class LegacyImportTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    /// <summary>The two anonymous GET answers of the legacy backend, shortened from production.</summary>
    private sealed class FakeLegacyApi : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken token)
        {
            var json = request.RequestUri!.AbsolutePath switch
            {
                "/tadeot-api/api/Products" => """
                    [{"id":2,"name":"Kaffee","price":150,"measure":"Becher","buffets":["OG 1"],"totalItemsSold":163},
                     {"id":15,"name":"Gutschein","price":-200,"measure":"Stück","buffets":["OG 9"],"totalItemsSold":188},
                     {"id":20,"name":"Tee","price":120.0,"measure":null,"buffets":[],"totalItemsSold":0}]
                    """,
                "/tadeot-api/api/Buffets" => """
                    [{"id":1,"location":"OG","description":"Maturaball 2025",
                      "movements":[{"id":21,"time":"2026-10-22T08:37:22.191+00:00","amount":400}],
                      "products":[{"name":"Gutschein","id":15,"measure":"Stück","price":-200,"amount":0,"rank":9},
                                  {"name":"Kaffee","id":2,"measure":"Becher","price":150,"amount":0,"rank":1}]}]
                    """,
                _ => null,
            };
            return Task.FromResult(json == null
                ? new HttpResponseMessage(HttpStatusCode.NotFound)
                : new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json"),
                });
        }
    }

    private HttpClient ClientWithFakeLegacyApi() => Factory
        .WithWebHostBuilder(builder => builder.ConfigureServices(services => services
            .AddHttpClient(Options.DefaultName)
            .ConfigurePrimaryHttpMessageHandler(() => new FakeLegacyApi())))
        .CreateClient();

    [Fact]
    public async Task ImportBuffet_ShouldKeepLegacyIds_AndContinueSequencesAfterThem()
    {
        var client = ClientWithFakeLegacyApi();

        var response = await client.PostAsync("/v1/api/legacy-import/buffet", null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<LegacyBuffetImportDto>();
        result.Should().Be(new LegacyBuffetImportDto(3, 1, 2));

        var products = await DbContext.Products.OrderBy(p => p.Id).ToListAsync();
        products.Select(p => p.Id).Should().Equal(2, 15, 20);
        products.Single(p => p.Id == 20).Unit.Should().Be("");
        products.Single(p => p.Id == 15).PriceCents.Should().Be(-200);

        var buffets = await client.GetFromJsonAsync<List<CashierBuffetDto>>("/v1/buffets");
        buffets!.Single().Id.Should().Be(1);
        buffets[0].Products.Select(p => p.Id).Should().Equal(2, 15);
        (await DbContext.CashMovements.AnyAsync()).Should().BeFalse();

        var created = await client.PostAsJsonAsync("/v1/api/products", new SaveProductDto("Kuchen", "Stück", 170));
        (await created.Content.ReadFromJsonAsync<ProductDto>())!.Id.Should().Be(21);
        var buffet = await client.PostAsJsonAsync("/v1/api/buffets", new SaveBuffetDto("EG", null));
        (await buffet.Content.ReadFromJsonAsync<BuffetDto>())!.Id.Should().Be(2);
    }

    [Fact]
    public async Task ImportBuffet_ShouldReturnConflict_WhenProductsExist()
    {
        var client = ClientWithFakeLegacyApi();
        (await client.PostAsync("/v1/api/legacy-import/buffet", null)).EnsureSuccessStatusCode();

        var second = await client.PostAsync("/v1/api/legacy-import/buffet", null);

        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await DbContext.Products.CountAsync()).Should().Be(3);
    }
}
