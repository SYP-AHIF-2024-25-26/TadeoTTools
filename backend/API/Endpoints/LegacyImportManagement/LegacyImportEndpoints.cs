using Database.Entities;
using Database.Repository;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.LegacyImportManagement;

/// <summary>
/// One-time transfer from the legacy TadeoT backend (only its anonymous GET endpoints are read).
/// The legacy ids are kept, so a kiosk switched back to the legacy backend still sends valid ids.
/// </summary>
public static class LegacyImportEndpoints
{
    public static async Task<IResult> ImportBuffet(TadeoTDbContext context, IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        if (await context.Products.AnyAsync() || await context.Buffets.AnyAsync())
        {
            return Results.Conflict("Products or buffets already exist. The import only fills empty tables.");
        }

        var baseUrl = configuration["LegacyApi:BaseUrl"]?.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            return Results.Problem("LegacyApi:BaseUrl is not configured.");
        }

        List<LegacyProductDto> products;
        List<LegacyBuffetDto> buffets;
        try
        {
            var http = httpClientFactory.CreateClient();
            products = await http.GetFromJsonAsync<List<LegacyProductDto>>($"{baseUrl}/api/Products") ?? [];
            buffets = await http.GetFromJsonAsync<List<LegacyBuffetDto>>($"{baseUrl}/api/Buffets") ?? [];
        }
        catch (Exception e) when (e is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException)
        {
            return Results.Problem($"The legacy backend could not be read: {e.Message}",
                statusCode: StatusCodes.Status502BadGateway);
        }

        // GET api/Products lists every product; the menus are only checked in case one is missing there.
        var allProducts = products
            .Select(p => (p.Id, p.Name, p.Measure, p.Price))
            .UnionBy(buffets.SelectMany(b => b.Products).Select(p => (p.Id, p.Name, p.Measure, p.Price)), p => p.Id)
            .ToList();

        await using var transaction = await context.Database.BeginTransactionAsync();

        context.Products.AddRange(allProducts.Select(p => new Product
        {
            Id = p.Id,
            Name = p.Name ?? "",
            Unit = p.Measure ?? "",
            // A double in the legacy database, holding cents.
            PriceCents = (int)Math.Round(p.Price),
        }));

        context.Buffets.AddRange(buffets.Select(b => new Buffet
        {
            Id = b.Id,
            Location = b.Location ?? "",
            Description = b.Description ?? "",
            Menu = b.Products
                .OrderBy(p => p.Rank)
                .Select((p, index) => new BuffetProduct { ProductId = p.Id, Order = index + 1 })
                .ToList(),
        }));

        await context.SaveChangesAsync();

        // The rows were inserted with explicit ids; new ones continue after the highest.
        await context.Database.ExecuteSqlRawAsync(
            """SELECT setval(pg_get_serial_sequence('"Products"', 'Id'), (SELECT COALESCE(MAX("Id"), 0) + 1 FROM "Products"), false)""");
        await context.Database.ExecuteSqlRawAsync(
            """SELECT setval(pg_get_serial_sequence('"Buffets"', 'Id'), (SELECT COALESCE(MAX("Id"), 0) + 1 FROM "Buffets"), false)""");

        await transaction.CommitAsync();

        return Results.Ok(new LegacyBuffetImportDto(
            allProducts.Count,
            buffets.Count,
            buffets.Sum(b => b.Products.Count)));
    }

    /// <summary><c>GET api/Products</c> of the legacy backend (other fields are ignored).</summary>
    public record LegacyProductDto(int Id, string? Name, double Price, string? Measure);

    /// <summary><c>GET api/Buffets</c> of the legacy backend; its cash movements are archived, not imported.</summary>
    public record LegacyBuffetDto(int Id, string? Location, string? Description, List<LegacyMenuProductDto> Products);

    public record LegacyMenuProductDto(int Id, string? Name, double Price, string? Measure, int Rank);

    public record LegacyBuffetImportDto(int Products, int Buffets, int MenuEntries);
}
