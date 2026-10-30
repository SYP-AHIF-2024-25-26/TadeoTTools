using System.Net;
using System.Net.Http.Json;
using System.Text;
using Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;
using static API.Endpoints.BuffetManagement.BuffetEndpoints;

namespace TadeoTIntegrationTests;

public class BuffetManagementTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private async Task<(Buffet Buffet, Product Coffee, Product Cake, Product Voucher)> SeedBuffetAsync()
    {
        var coffee = new Product { Name = "Kaffee", Unit = "Becher", PriceCents = 150 };
        var cake = new Product { Name = "Kuchen", Unit = "Stück", PriceCents = 170 };
        var voucher = new Product { Name = "Gutschein", Unit = "Stück", PriceCents = -200 };
        var buffet = new Buffet
        {
            Location = "OG",
            Menu =
            [
                new BuffetProduct { Product = cake, Order = 2 },
                new BuffetProduct { Product = coffee, Order = 1 },
                new BuffetProduct { Product = voucher, Order = 3 },
            ],
        };
        DbContext.Buffets.Add(buffet);
        await DbContext.SaveChangesAsync();
        return (buffet, coffee, cake, voucher);
    }

    private static CreateOrderDto Order(int buffetId, string orderNumber, params (int ProductId, int Amount)[] units) =>
        new(buffetId, DateTimeOffset.Parse("2026-11-20T09:15:00+01:00"),
            units.Select(u => new SoldUnitDto(u.ProductId, u.Amount)).ToList(), orderNumber);

    [Fact]
    public async Task GetCashierBuffets_ShouldReturnMenuInOrder_AndHideBuffetsWithEmptyMenu()
    {
        var (buffet, coffee, cake, voucher) = await SeedBuffetAsync();
        DbContext.Buffets.Add(new Buffet { Location = "EG" });
        await DbContext.SaveChangesAsync();

        var response = await Client.GetAsync("/v1/buffets");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var buffets = await response.Content.ReadFromJsonAsync<List<CashierBuffetDto>>();
        buffets.Should().ContainSingle();
        buffets![0].Id.Should().Be(buffet.Id);
        buffets[0].Products.Select(p => p.Id).Should().Equal(coffee.Id, cake.Id, voucher.Id);
        buffets[0].Products[0].Price.Should().Be(150);
        buffets[0].Products[0].Measure.Should().Be("Becher");
    }

    [Fact]
    public async Task CreateOrder_ShouldStoreSaleWithCurrentPrice_InUtc()
    {
        var (buffet, coffee, cake, _) = await SeedBuffetAsync();

        var response = await Client.PostAsJsonAsync("/v1/orders",
            Order(buffet.Id, "K7Q2-0001", (coffee.Id, 2), (cake.Id, 1)));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var order = await DbContext.Orders.Include(o => o.Items).SingleAsync();
        order.CreatedAt.Should().Be(new DateTime(2026, 11, 20, 8, 15, 0, DateTimeKind.Utc));
        order.Items.Should().HaveCount(2);
        order.Items.Single(i => i.ProductId == coffee.Id).UnitPriceCents.Should().Be(150);
    }

    [Fact]
    public async Task CreateOrder_ShouldBeIdempotent_OnOrderNumber()
    {
        var (buffet, coffee, _, _) = await SeedBuffetAsync();
        var order = Order(buffet.Id, "K7Q2-0002", (coffee.Id, 1));

        var first = await Client.PostAsJsonAsync("/v1/orders", order);
        var second = await Client.PostAsJsonAsync("/v1/orders", order);

        first.StatusCode.Should().Be(HttpStatusCode.OK);
        second.StatusCode.Should().Be(HttpStatusCode.OK);
        (await DbContext.Orders.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task CreateOrder_ShouldAcceptRetry_EvenAfterProductLeftTheMenu()
    {
        var (buffet, coffee, _, _) = await SeedBuffetAsync();
        var order = Order(buffet.Id, "K7Q2-0003", (coffee.Id, 1));
        (await Client.PostAsJsonAsync("/v1/orders", order)).EnsureSuccessStatusCode();

        await DbContext.BuffetProducts.Where(m => m.ProductId == coffee.Id).ExecuteDeleteAsync();
        var retry = await Client.PostAsJsonAsync("/v1/orders", order);

        retry.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateOrder_ShouldReturnNotFound_WhenBuffetDoesNotExist()
    {
        var (_, coffee, _, _) = await SeedBuffetAsync();

        var response = await Client.PostAsJsonAsync("/v1/orders", Order(9999, "K7Q2-0004", (coffee.Id, 1)));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateOrder_ShouldReturnBadRequest_WhenProductIsNotOnTheMenu()
    {
        var (buffet, _, _, _) = await SeedBuffetAsync();
        var tea = new Product { Name = "Tee", PriceCents = 120 };
        DbContext.Products.Add(tea);
        await DbContext.SaveChangesAsync();

        var response = await Client.PostAsJsonAsync("/v1/orders", Order(buffet.Id, "K7Q2-0005", (tea.Id, 1)));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await DbContext.Orders.AnyAsync()).Should().BeFalse();
    }

    [Fact]
    public async Task CreateOrder_ShouldAcceptOneVoucher_AndRejectTwo()
    {
        var (buffet, coffee, _, voucher) = await SeedBuffetAsync();
        var secondVoucher = new Product { Name = "Gutschein Lehrkraft", PriceCents = -100 };
        DbContext.Products.Add(secondVoucher);
        DbContext.BuffetProducts.Add(new BuffetProduct { BuffetId = buffet.Id, Product = secondVoucher, Order = 4 });
        await DbContext.SaveChangesAsync();

        var one = await Client.PostAsJsonAsync("/v1/orders",
            Order(buffet.Id, "K7Q2-0006", (coffee.Id, 3), (voucher.Id, 1)));
        var twoOfOne = await Client.PostAsJsonAsync("/v1/orders",
            Order(buffet.Id, "K7Q2-0007", (coffee.Id, 3), (voucher.Id, 2)));
        var twoDifferent = await Client.PostAsJsonAsync("/v1/orders",
            Order(buffet.Id, "K7Q2-0008", (coffee.Id, 3), (voucher.Id, 1), (secondVoucher.Id, 1)));

        one.StatusCode.Should().Be(HttpStatusCode.OK);
        twoOfOne.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        twoDifferent.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(100)]
    public async Task CreateOrder_ShouldReturnBadRequest_WhenAmountIsOutOfRange(int amount)
    {
        var (buffet, coffee, _, _) = await SeedBuffetAsync();

        var response = await Client.PostAsJsonAsync("/v1/orders",
            Order(buffet.Id, $"K7Q2-01{amount + 10}", (coffee.Id, amount)));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetSales_ShouldUseTheStoredSalePrice_AfterAPriceChange()
    {
        var (buffet, coffee, _, voucher) = await SeedBuffetAsync();
        (await Client.PostAsJsonAsync("/v1/orders",
            Order(buffet.Id, "K7Q2-0010", (coffee.Id, 2), (voucher.Id, 1)))).EnsureSuccessStatusCode();

        (await Client.PutAsJsonAsync($"/v1/api/products/{coffee.Id}",
            new SaveProductDto("Kaffee", "Becher", 300))).EnsureSuccessStatusCode();
        (await Client.PostAsJsonAsync("/v1/orders",
            Order(buffet.Id, "K7Q2-0011", (coffee.Id, 1)))).EnsureSuccessStatusCode();

        var sales = await Client.GetFromJsonAsync<SalesDto>("/v1/api/sales");

        sales!.OrderCount.Should().Be(2);
        var buffetSales = sales.Buffets.Single();
        buffetSales.Products.Single(p => p.ProductId == coffee.Id).RevenueCents.Should().Be(2 * 150 + 300);
        buffetSales.Products.Single(p => p.ProductId == coffee.Id).Quantity.Should().Be(3);
        buffetSales.RevenueCents.Should().Be(2 * 150 + 300 - 200);
        sales.RevenueCents.Should().Be(buffetSales.RevenueCents);
    }

    [Fact]
    public async Task GetSalesCsv_ShouldListItemsInViennaTime_WithBom()
    {
        var (buffet, coffee, _, _) = await SeedBuffetAsync();
        (await Client.PostAsJsonAsync("/v1/orders",
            Order(buffet.Id, "K7Q2-0012", (coffee.Id, 2)))).EnsureSuccessStatusCode();

        var bytes = await Client.GetByteArrayAsync("/v1/api/sales/csv");

        bytes.Take(3).Should().Equal(0xEF, 0xBB, 0xBF);
        var lines = Encoding.UTF8.GetString(bytes[3..]).Split("\r\n", StringSplitOptions.RemoveEmptyEntries)
            .SelectMany(l => l.Split('\n', StringSplitOptions.RemoveEmptyEntries))
            .ToList();
        lines.Should().HaveCount(2);
        lines[1].Should().Be("OG;K7Q2-0012;20.11.2026;09:15:00;Kaffee;1,50;2;3,00;admin"); // username of FakePolicyEvaluator
    }

    [Fact]
    public async Task GetSalesStatistics_ShouldGroupByViennaHourAndDay_AndKeepVouchersApart()
    {
        var (buffet, coffee, cake, voucher) = await SeedBuffetAsync();
        // 22:30 UTC on 19.11 is 23:30 in Vienna; 23:10 UTC is already 00:10 on 20.11.
        foreach (var (number, time, units) in new (string, string, (int, int)[])[]
                 {
                     ("S-1", "2026-11-20T08:15:00+01:00", [(coffee.Id, 2), (voucher.Id, 1)]),
                     ("S-2", "2026-11-20T10:05:00+01:00", [(cake.Id, 1)]),
                     ("S-3", "2026-11-19T22:30:00Z", [(coffee.Id, 1)]),
                     ("S-4", "2026-11-19T23:10:00Z", [(coffee.Id, 1)]),
                 })
        {
            var order = new CreateOrderDto(buffet.Id, DateTimeOffset.Parse(time),
                units.Select(u => new SoldUnitDto(u.Item1, u.Item2)).ToList(), number);
            (await Client.PostAsJsonAsync("/v1/orders", order)).EnsureSuccessStatusCode();
        }

        var stats = await Client.GetFromJsonAsync<SalesStatisticsDto>("/v1/api/sales/statistics");

        stats!.OrderCount.Should().Be(4);
        stats.ItemCount.Should().Be(5);
        stats.VoucherCount.Should().Be(1);
        stats.VoucherCents.Should().Be(-200);
        stats.RevenueCents.Should().Be(4 * 150 + 170 - 200);
        stats.Days.Select(d => d.Date).Should().Equal(new DateOnly(2026, 11, 20), new DateOnly(2026, 11, 19));
        stats.Days[0].Hours.Select(h => (h.Hour, h.OrderCount)).Should().Equal((0, 1), (1, 0), (2, 0), (3, 0),
            (4, 0), (5, 0), (6, 0), (7, 0), (8, 1), (9, 0), (10, 1));
        stats.Days[1].Hours.Should().Equal(new SalesHourDto(23, 1, 150));
        stats.Products.Select(p => (p.Name, p.Quantity)).Should().Equal(("Kaffee", 4), ("Kuchen", 1));
    }

    [Fact]
    public async Task DeleteSales_ShouldDeleteOrdersAndItems_ButKeepProducts()
    {
        var (buffet, coffee, _, _) = await SeedBuffetAsync();
        (await Client.PostAsJsonAsync("/v1/orders",
            Order(buffet.Id, "K7Q2-0013", (coffee.Id, 2)))).EnsureSuccessStatusCode();

        var response = await Client.DeleteAsync("/v1/api/sales");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await DbContext.Orders.AnyAsync()).Should().BeFalse();
        (await DbContext.OrderItems.AnyAsync()).Should().BeFalse();
        (await DbContext.Products.CountAsync()).Should().Be(3);
    }

    [Fact]
    public async Task DeleteProduct_ShouldReturnConflict_WhenOnAMenuOrSold()
    {
        var (buffet, coffee, _, _) = await SeedBuffetAsync();
        (await Client.PostAsJsonAsync("/v1/orders",
            Order(buffet.Id, "K7Q2-0014", (coffee.Id, 1)))).EnsureSuccessStatusCode();

        var onMenu = await Client.DeleteAsync($"/v1/api/products/{coffee.Id}");
        (await Client.PutAsJsonAsync($"/v1/api/buffets/{buffet.Id}/menu", Array.Empty<int>())).EnsureSuccessStatusCode();
        var sold = await Client.DeleteAsync($"/v1/api/products/{coffee.Id}");

        onMenu.StatusCode.Should().Be(HttpStatusCode.Conflict);
        sold.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await sold.Content.ReadAsStringAsync()).Should().Contain("sales");
    }

    [Fact]
    public async Task DeleteBuffet_ShouldReturnConflict_WhenItHasSales_AndDeleteWithItsMenuOtherwise()
    {
        var (buffet, coffee, _, _) = await SeedBuffetAsync();
        var empty = new Buffet { Location = "EG", Menu = [new BuffetProduct { ProductId = coffee.Id, Order = 1 }] };
        DbContext.Buffets.Add(empty);
        await DbContext.SaveChangesAsync();
        (await Client.PostAsJsonAsync("/v1/orders",
            Order(buffet.Id, "K7Q2-0015", (coffee.Id, 1)))).EnsureSuccessStatusCode();

        var withSales = await Client.DeleteAsync($"/v1/api/buffets/{buffet.Id}");
        var withoutSales = await Client.DeleteAsync($"/v1/api/buffets/{empty.Id}");

        withSales.StatusCode.Should().Be(HttpStatusCode.Conflict);
        withoutSales.StatusCode.Should().Be(HttpStatusCode.OK);
        (await DbContext.BuffetProducts.AnyAsync(m => m.BuffetId == empty.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task UpdateMenu_ShouldReplaceTheMenuInListOrder()
    {
        var (buffet, _, cake, voucher) = await SeedBuffetAsync();

        var response = await Client.PutAsJsonAsync($"/v1/api/buffets/{buffet.Id}/menu", new[] { voucher.Id, cake.Id });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var buffets = await Client.GetFromJsonAsync<List<BuffetDto>>("/v1/api/buffets");
        buffets!.Single().Menu.Should().Equal(voucher.Id, cake.Id);
    }

    [Fact]
    public async Task UpdateMenu_ShouldReturnBadRequest_ForDuplicateOrUnknownProducts()
    {
        var (buffet, coffee, _, _) = await SeedBuffetAsync();

        var duplicate = await Client.PutAsJsonAsync($"/v1/api/buffets/{buffet.Id}/menu", new[] { coffee.Id, coffee.Id });
        var unknown = await Client.PutAsJsonAsync($"/v1/api/buffets/{buffet.Id}/menu", new[] { 9999 });

        duplicate.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        unknown.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateBuffet_ShouldReturnConflict_ForADuplicateLocation()
    {
        await SeedBuffetAsync();

        var response = await Client.PostAsJsonAsync("/v1/api/buffets", new SaveBuffetDto("OG", null));

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CashMovements_ShouldBeAddedAndDeleted()
    {
        var (buffet, _, _, _) = await SeedBuffetAsync();

        var added = await Client.PostAsJsonAsync($"/v1/api/buffets/{buffet.Id}/cash-movements",
            new AddCashMovementDto(null, 5000));
        var movement = await added.Content.ReadFromJsonAsync<CashMovementDto>();
        var zero = await Client.PostAsJsonAsync($"/v1/api/buffets/{buffet.Id}/cash-movements",
            new AddCashMovementDto(null, 0));
        var deleted = await Client.DeleteAsync($"/v1/api/cash-movements/{movement!.Id}");

        added.StatusCode.Should().Be(HttpStatusCode.OK);
        movement.AmountCents.Should().Be(5000);
        zero.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        deleted.StatusCode.Should().Be(HttpStatusCode.OK);
        (await DbContext.CashMovements.AnyAsync()).Should().BeFalse();
    }
}
