using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Security.Claims;
using System.Text;
using Database.Entities;
using Database.Repository;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.BuffetManagement;

public static class BuffetEndpoints
{
    private static readonly TimeZoneInfo Vienna = TimeZoneInfo.FindSystemTimeZoneById("Europe/Vienna");
    private static readonly CultureInfo German = CultureInfo.GetCultureInfo("de-AT");

    // ---- Cashier kiosk ----

    /// <summary>Same shape as the legacy <c>GET api/Buffets</c>; a buffet with an empty menu is left out.</summary>
    public static async Task<IResult> GetCashierBuffets(TadeoTDbContext context)
    {
        var buffets = await context.Buffets
            .Where(b => b.Menu.Any())
            .OrderBy(b => b.Id)
            .Select(b => new CashierBuffetDto(
                b.Id,
                b.Location,
                b.Description,
                b.Menu
                    .OrderBy(m => m.Order)
                    .Select(m => new CashierProductDto(
                        m.ProductId,
                        m.Product!.Name,
                        m.Product.Unit,
                        m.Product.PriceCents,
                        m.Order))
                    .ToList()))
            .ToListAsync();

        return Results.Ok(buffets);
    }

    /// <summary>
    /// Stores a sale with the current prices. A sale whose number is already stored is
    /// answered with 200 by <see cref="BuffetValidations.CreateOrderValidationAsync"/>.
    /// </summary>
    public static async Task<IResult> CreateOrder(TadeoTDbContext context, CreateOrderDto dto, ClaimsPrincipal user)
    {
        var productIds = dto.SoldUnits.Select(u => u.ProductId).ToList();
        var prices = await context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.PriceCents);

        var order = new Order
        {
            OrderNumber = dto.OrderNumber,
            CreatedAt = dto.Date.UtcDateTime,
            BuffetId = dto.BuffetId,
            CashierUsername = user.FindFirst("preferred_username")?.Value ?? "",
            Items = dto.SoldUnits
                .Select(u => new OrderItem
                {
                    ProductId = u.ProductId,
                    Quantity = u.Amount,
                    UnitPriceCents = prices[u.ProductId],
                })
                .ToList(),
        };

        context.Orders.Add(order);
        await context.SaveChangesAsync();
        return Results.Ok();
    }

    // ---- Products (admin) ----

    public static async Task<IResult> GetProducts(TadeoTDbContext context)
    {
        var products = await context.Products
            .OrderBy(p => p.Name)
            .Select(p => new ProductDto(
                p.Id,
                p.Name,
                p.Unit,
                p.PriceCents,
                p.BuffetProducts.Count,
                p.OrderItems.Sum(i => i.Quantity)))
            .ToListAsync();

        return Results.Ok(products);
    }

    public static async Task<IResult> CreateProduct(TadeoTDbContext context, SaveProductDto dto)
    {
        var product = new Product { Name = dto.Name, Unit = dto.Unit ?? "", PriceCents = dto.PriceCents };
        context.Products.Add(product);
        await context.SaveChangesAsync();

        return Results.Ok(new ProductDto(product.Id, product.Name, product.Unit, product.PriceCents, 0, 0));
    }

    public static async Task<IResult> UpdateProduct(TadeoTDbContext context, int productId, SaveProductDto dto)
    {
        var product = await context.Products.FindAsync(productId);

        product!.Name = dto.Name;
        product.Unit = dto.Unit ?? "";
        product.PriceCents = dto.PriceCents;

        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public static async Task<IResult> DeleteProduct(TadeoTDbContext context, int productId)
    {
        await context.Products.Where(p => p.Id == productId).ExecuteDeleteAsync();
        return Results.Ok();
    }

    // ---- Buffets (admin) ----

    public static async Task<IResult> GetBuffets(TadeoTDbContext context)
    {
        var buffets = await context.Buffets
            .OrderBy(b => b.Location)
            .Select(b => new BuffetDto(
                b.Id,
                b.Location,
                b.Description,
                b.Menu.OrderBy(m => m.Order).Select(m => m.ProductId).ToList(),
                b.CashMovements
                    .OrderBy(c => c.Time)
                    .Select(c => new CashMovementDto(c.Id, c.Time, c.AmountCents))
                    .ToList(),
                b.Orders.Count))
            .ToListAsync();

        return Results.Ok(buffets);
    }

    public static async Task<IResult> CreateBuffet(TadeoTDbContext context, SaveBuffetDto dto)
    {
        var buffet = new Buffet { Location = dto.Location, Description = dto.Description ?? "" };
        context.Buffets.Add(buffet);
        await context.SaveChangesAsync();

        return Results.Ok(new BuffetDto(buffet.Id, buffet.Location, buffet.Description, [], [], 0));
    }

    public static async Task<IResult> UpdateBuffet(TadeoTDbContext context, int buffetId, SaveBuffetDto dto)
    {
        var buffet = await context.Buffets.FindAsync(buffetId);

        buffet!.Location = dto.Location;
        buffet.Description = dto.Description ?? "";

        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public static async Task<IResult> DeleteBuffet(TadeoTDbContext context, int buffetId)
    {
        // The menu goes with it (cascade).
        await context.Buffets.Where(b => b.Id == buffetId).ExecuteDeleteAsync();
        return Results.Ok();
    }

    /// <summary>Replaces the whole menu; the list order is the order at the counter.</summary>
    public static async Task<IResult> UpdateMenu(TadeoTDbContext context, int buffetId, [FromBody] int[] productIds)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();

        await context.BuffetProducts.Where(m => m.BuffetId == buffetId).ExecuteDeleteAsync();
        context.BuffetProducts.AddRange(productIds.Select((productId, index) => new BuffetProduct
        {
            BuffetId = buffetId,
            ProductId = productId,
            Order = index + 1,
        }));
        await context.SaveChangesAsync();

        await transaction.CommitAsync();
        return Results.Ok();
    }

    public static async Task<IResult> AddCashMovement(TadeoTDbContext context, int buffetId, AddCashMovementDto dto)
    {
        var movement = new CashMovement
        {
            BuffetId = buffetId,
            Time = dto.Time?.UtcDateTime ?? DateTime.UtcNow,
            AmountCents = dto.AmountCents,
        };
        context.CashMovements.Add(movement);
        await context.SaveChangesAsync();

        return Results.Ok(new CashMovementDto(movement.Id, movement.Time, movement.AmountCents));
    }

    public static async Task<IResult> DeleteCashMovement(TadeoTDbContext context, int cashMovementId)
    {
        await context.CashMovements.Where(c => c.Id == cashMovementId).ExecuteDeleteAsync();
        return Results.Ok();
    }

    // ---- Sales (admin) ----

    /// <summary>Revenue per buffet and product, from the price each item was sold at.</summary>
    public static async Task<IResult> GetSales(TadeoTDbContext context)
    {
        var items = await context.OrderItems
            .GroupBy(i => new { i.Order!.BuffetId, i.ProductId, i.Product!.Name })
            .Select(g => new
            {
                g.Key.BuffetId,
                g.Key.ProductId,
                g.Key.Name,
                Quantity = g.Sum(i => i.Quantity),
                RevenueCents = g.Sum(i => i.Quantity * i.UnitPriceCents),
            })
            .ToListAsync();

        var buffets = await context.Buffets
            .OrderBy(b => b.Location)
            .Select(b => new
            {
                b.Id,
                b.Location,
                OrderCount = b.Orders.Count,
                CashCents = b.CashMovements.Sum(c => c.AmountCents),
            })
            .ToListAsync();

        var perBuffet = buffets
            .Select(b =>
            {
                var products = items
                    .Where(i => i.BuffetId == b.Id)
                    .OrderBy(i => i.Name)
                    .Select(i => new ProductSalesDto(i.ProductId, i.Name, i.Quantity, i.RevenueCents))
                    .ToList();
                return new BuffetSalesDto(
                    b.Id,
                    b.Location,
                    b.OrderCount,
                    products.Sum(p => p.RevenueCents),
                    b.CashCents,
                    products);
            })
            .ToList();

        return Results.Ok(new SalesDto(
            perBuffet.Sum(b => b.OrderCount),
            perBuffet.Sum(b => b.RevenueCents),
            perBuffet));
    }

    /// <summary>One row per sold product line; times in Vienna time, amounts in euros.</summary>
    public static async Task<IResult> GetSalesCsv(TadeoTDbContext context)
    {
        var rows = await context.OrderItems
            .OrderBy(i => i.Order!.CreatedAt)
            .ThenBy(i => i.Id)
            .Select(i => new
            {
                i.Order!.Buffet!.Location,
                i.Order.OrderNumber,
                i.Order.CreatedAt,
                i.Order.CashierUsername,
                ProductName = i.Product!.Name,
                i.Quantity,
                i.UnitPriceCents,
            })
            .ToListAsync();

        var csvBuilder = new StringBuilder();
        csvBuilder.AppendLine("Buffet;Bestellnummer;Datum;Uhrzeit;Produkt;Einzelpreis;Menge;Summe;Kassier");

        foreach (var row in rows)
        {
            var local = TimeZoneInfo.ConvertTimeFromUtc(row.CreatedAt, Vienna);
            csvBuilder.AppendLine(string.Join(";",
                Utils.EscapeCsvField(row.Location),
                Utils.EscapeCsvField(row.OrderNumber),
                local.ToString("dd.MM.yyyy", German),
                local.ToString("HH:mm:ss", German),
                Utils.EscapeCsvField(row.ProductName),
                Euro(row.UnitPriceCents),
                row.Quantity,
                Euro(row.Quantity * row.UnitPriceCents),
                Utils.EscapeCsvField(row.CashierUsername)));
        }

        return Results.File(
            fileContents: Utils.ToUtf8Bom(csvBuilder.ToString()),
            contentType: "text/csv",
            fileDownloadName: "buffet-sales.csv"
        );
    }

    /// <summary>
    /// Key figures, sales per hour (Vienna time) for each day with sales, newest day first,
    /// and the products by quantity sold. Hours run from the first to the last hour with a sale.
    /// </summary>
    public static async Task<IResult> GetSalesStatistics(TadeoTDbContext context)
    {
        var orders = await context.Orders
            .Select(o => new
            {
                o.CreatedAt,
                RevenueCents = o.Items.Sum(i => i.Quantity * i.UnitPriceCents),
            })
            .ToListAsync();

        var items = await context.OrderItems
            .GroupBy(i => new { i.ProductId, i.Product!.Name })
            .Select(g => new
            {
                g.Key.ProductId,
                g.Key.Name,
                Quantity = g.Sum(i => i.Quantity),
                RevenueCents = g.Sum(i => i.Quantity * i.UnitPriceCents),
                IsVoucher = g.Max(i => i.UnitPriceCents) < 0,
            })
            .ToListAsync();

        var days = orders
            .Select(o => new { Local = TimeZoneInfo.ConvertTimeFromUtc(o.CreatedAt, Vienna), o.RevenueCents })
            .GroupBy(o => DateOnly.FromDateTime(o.Local))
            .OrderByDescending(d => d.Key)
            .Select(d =>
            {
                var byHour = d.GroupBy(o => o.Local.Hour).ToDictionary(h => h.Key, h => h.ToList());
                var hours = Enumerable.Range(byHour.Keys.Min(), byHour.Keys.Max() - byHour.Keys.Min() + 1)
                    .Select(hour => byHour.TryGetValue(hour, out var sold)
                        ? new SalesHourDto(hour, sold.Count, sold.Sum(o => o.RevenueCents))
                        : new SalesHourDto(hour, 0, 0))
                    .ToList();
                return new SalesDayDto(d.Key, d.Count(), d.Sum(o => o.RevenueCents), hours);
            })
            .ToList();

        var products = items
            .Where(i => !i.IsVoucher)
            .OrderByDescending(i => i.Quantity)
            .ThenBy(i => i.Name)
            .Select(i => new ProductRankDto(i.ProductId, i.Name, i.Quantity, i.RevenueCents))
            .ToList();

        return Results.Ok(new SalesStatisticsDto(
            orders.Count,
            orders.Sum(o => o.RevenueCents),
            products.Sum(p => p.Quantity),
            items.Where(i => i.IsVoucher).Sum(i => i.Quantity),
            items.Where(i => i.IsVoucher).Sum(i => i.RevenueCents),
            days,
            products));
    }

    public static async Task<IResult> DeleteSales(TadeoTDbContext context)
    {
        // The order items go with them (cascade).
        await context.Orders.ExecuteDeleteAsync();
        return Results.NoContent();
    }

    private static string Euro(int cents) => (cents / 100m).ToString("0.00", German);

    // ---- DTOs ----

    public record CashierProductDto(int Id, string Name, string Measure, int Price, int Rank);

    public record CashierBuffetDto(int Id, string Location, string Description, List<CashierProductDto> Products);

    public record SoldUnitDto(int ProductId, int Amount);

    /// <summary>The legacy <c>POST api/orders</c> body, so sales queued before the switch still go through.</summary>
    public record CreateOrderDto(
        int BuffetId,
        DateTimeOffset Date,
        [Required] List<SoldUnitDto> SoldUnits,
        [Required, MaxLength(50)] string OrderNumber
    );

    public record ProductDto(int Id, string Name, string Unit, int PriceCents, int MenuCount, int SoldCount);

    public record SaveProductDto(
        [Required, MaxLength(40)] string Name,
        [MaxLength(20)] string? Unit,
        [Range(-100000, 100000)] int PriceCents
    );

    public record CashMovementDto(int Id, DateTime Time, int AmountCents);

    public record BuffetDto(
        int Id,
        string Location,
        string Description,
        List<int> Menu,
        List<CashMovementDto> CashMovements,
        int OrderCount);

    public record SaveBuffetDto(
        [Required, MaxLength(3)] string Location,
        [MaxLength(100)] string? Description
    );

    public record AddCashMovementDto(DateTimeOffset? Time, [Range(-10000000, 10000000)] int AmountCents);

    public record ProductSalesDto(int ProductId, string Name, int Quantity, int RevenueCents);

    public record BuffetSalesDto(
        int BuffetId,
        string Location,
        int OrderCount,
        int RevenueCents,
        int CashCents,
        List<ProductSalesDto> Products);

    public record SalesDto(int OrderCount, int RevenueCents, List<BuffetSalesDto> Buffets);

    public record SalesHourDto(int Hour, int OrderCount, int RevenueCents);

    public record SalesDayDto(DateOnly Date, int OrderCount, int RevenueCents, List<SalesHourDto> Hours);

    public record ProductRankDto(int ProductId, string Name, int Quantity, int RevenueCents);

    /// <summary>Item and voucher counts exclude each other; voucher cents are negative.</summary>
    public record SalesStatisticsDto(
        int OrderCount,
        int RevenueCents,
        int ItemCount,
        int VoucherCount,
        int VoucherCents,
        List<SalesDayDto> Days,
        List<ProductRankDto> Products);
}
