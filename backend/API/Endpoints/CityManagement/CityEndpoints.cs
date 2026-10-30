using System.ComponentModel.DataAnnotations;
using System.Text;
using System.Text.RegularExpressions;
using Database.Entities;
using Database.Repository;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.CityManagement;

/// <summary>
/// The towns and districts for the registration kiosk's postcode field and the district statistics.
/// Filled once from the legacy data by csv import, then kept up to date in the dashboard.
/// </summary>
public static partial class CityEndpoints
{
    public const string DistrictCsvHeader = "Number;Name";
    public const string CityCsvHeader = "Id;ZipCode;Name;Number;DistrictNumber";

    [GeneratedRegex("^[1-9][0-9]{3}$")]
    private static partial Regex ZipCodePattern();

    public static bool IsZipCode(string value) => ZipCodePattern().IsMatch(value);

    // ---- Registration kiosk ----

    /// <summary>Same shape as the legacy <c>GET api/Cities</c>.</summary>
    public static async Task<IResult> GetKioskCities(TadeoTDbContext context)
    {
        var cities = await context.Cities
            .OrderBy(c => c.Name)
            .ThenBy(c => c.ZipCode)
            .Select(c => new KioskCityDto(c.Id, c.Name, c.ZipCode))
            .ToListAsync();

        return Results.Ok(cities);
    }

    // ---- Districts (admin) ----

    public static async Task<IResult> GetDistricts(TadeoTDbContext context)
    {
        var districts = await context.Districts
            .OrderBy(d => d.Number)
            .Select(d => new DistrictDto(d.Id, d.Number, d.Name, d.Cities.Count))
            .ToListAsync();

        return Results.Ok(districts);
    }

    public static async Task<IResult> CreateDistrict(TadeoTDbContext context, SaveDistrictDto dto)
    {
        var district = new District { Number = dto.Number, Name = dto.Name };
        context.Districts.Add(district);
        await context.SaveChangesAsync();

        return Results.Ok(new DistrictDto(district.Id, district.Number, district.Name, 0));
    }

    public static async Task<IResult> UpdateDistrict(TadeoTDbContext context, int districtId, SaveDistrictDto dto)
    {
        var district = await context.Districts.FindAsync(districtId);

        district!.Number = dto.Number;
        district.Name = dto.Name;

        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public static async Task<IResult> DeleteDistrict(TadeoTDbContext context, int districtId)
    {
        await context.Districts.Where(d => d.Id == districtId).ExecuteDeleteAsync();
        return Results.Ok();
    }

    public static async Task<IResult> GetDistrictsCsv(TadeoTDbContext context)
    {
        var districts = await context.Districts.OrderBy(d => d.Number).ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine(DistrictCsvHeader);
        foreach (var d in districts)
        {
            csv.AppendLine($"{d.Number};{Utils.EscapeCsvField(d.Name)}");
        }

        return Results.File(Utils.ToUtf8Bom(csv.ToString()), "text/csv", "districts.csv");
    }

    /// <summary>Fills the empty district list from a csv file; all or nothing.</summary>
    public static async Task<IResult> ImportDistrictsCsv(TadeoTDbContext context, HttpRequest request)
    {
        if (await context.Districts.AnyAsync())
        {
            return Results.Conflict("There are districts already. Edit them instead of importing.");
        }

        var csv = await Utils.ReadCsvAsync(request);
        if (csv is null)
        {
            return Utils.CsvErrors(["The file is larger than 1 MB."]);
        }

        var (header, rows) = csv.Value;
        if (!Utils.HasColumns(header, DistrictCsvHeader.Split(';')))
        {
            return Utils.CsvErrors([$"Line 1: the columns must be {DistrictCsvHeader}."]);
        }

        var errors = new List<string>();
        var districts = new List<District>();
        foreach (var row in rows)
        {
            var number = row.Fields[0].Trim();
            var name = row.Fields.ElementAtOrDefault(1)?.Trim() ?? "";

            if (row.Fields.Length != 2)
                errors.Add($"Line {row.Line}: expected 2 columns, found {row.Fields.Length}.");
            else if (!int.TryParse(number, out var n) || n is < 100 or > 999)
                errors.Add($"Line {row.Line}: the number \"{number}\" must have three digits.");
            else if (name is "" or { Length: > 100 })
                errors.Add($"Line {row.Line}: the name is required (at most 100 characters).");
            else if (districts.Any(d => d.Number == n))
                errors.Add($"Line {row.Line}: district number {n} appears twice.");
            else if (districts.Any(d => string.Equals(d.Name, name, StringComparison.OrdinalIgnoreCase)))
                errors.Add($"Line {row.Line}: district \"{name}\" appears twice.");
            else
                districts.Add(new District { Number = n, Name = name });
        }

        if (errors.Count > 0) return Utils.CsvErrors(errors);
        if (districts.Count == 0) return Utils.CsvErrors(["The file has no districts."]);

        context.Districts.AddRange(districts);
        await context.SaveChangesAsync();
        return Results.Ok(new Utils.CsvImportResultDto(districts.Count));
    }

    // ---- Cities (admin) ----

    /// <summary>All towns (about 2,100); the dashboard searches and filters them itself.</summary>
    public static async Task<IResult> GetCities(TadeoTDbContext context)
    {
        var cities = await context.Cities
            .OrderBy(c => c.ZipCode)
            .ThenBy(c => c.Name)
            .Select(c => new CityDto(c.Id, c.ZipCode, c.Name, c.Number, c.DistrictId, c.Visitors.Count))
            .ToListAsync();

        return Results.Ok(cities);
    }

    public static async Task<IResult> CreateCity(TadeoTDbContext context, SaveCityDto dto)
    {
        var city = new City { ZipCode = dto.ZipCode, Name = dto.Name, Number = dto.Number, DistrictId = dto.DistrictId };
        context.Cities.Add(city);
        await context.SaveChangesAsync();

        return Results.Ok(new CityDto(city.Id, city.ZipCode, city.Name, city.Number, city.DistrictId, 0));
    }

    public static async Task<IResult> UpdateCity(TadeoTDbContext context, int cityId, SaveCityDto dto)
    {
        var city = await context.Cities.FindAsync(cityId);

        city!.ZipCode = dto.ZipCode;
        city.Name = dto.Name;
        city.Number = dto.Number;
        city.DistrictId = dto.DistrictId;

        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public static async Task<IResult> DeleteCity(TadeoTDbContext context, int cityId)
    {
        await context.Cities.Where(c => c.Id == cityId).ExecuteDeleteAsync();
        return Results.Ok();
    }

    public static async Task<IResult> GetCitiesCsv(TadeoTDbContext context)
    {
        var cities = await context.Cities
            .OrderBy(c => c.Id)
            .Select(c => new { c.Id, c.ZipCode, c.Name, c.Number, DistrictNumber = c.District!.Number })
            .ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine(CityCsvHeader);
        foreach (var c in cities)
        {
            csv.AppendLine($"{c.Id};{c.ZipCode};{Utils.EscapeCsvField(c.Name)};{c.Number};{c.DistrictNumber}");
        }

        return Results.File(Utils.ToUtf8Bom(csv.ToString()), "text/csv", "cities.csv");
    }

    /// <summary>
    /// Fills the empty town list from a csv file; all or nothing. A given <c>Id</c> is kept (the
    /// legacy ids), an empty one gets a new id after the highest kept one.
    /// </summary>
    public static async Task<IResult> ImportCitiesCsv(TadeoTDbContext context, HttpRequest request)
    {
        if (await context.Cities.AnyAsync())
        {
            return Results.Conflict("There are towns already. Edit them instead of importing.");
        }

        var districtIds = await context.Districts.ToDictionaryAsync(d => d.Number, d => d.Id);
        if (districtIds.Count == 0)
        {
            return Utils.CsvErrors(["Import the districts first: every town belongs to one."]);
        }

        var csv = await Utils.ReadCsvAsync(request);
        if (csv is null)
        {
            return Utils.CsvErrors(["The file is larger than 1 MB."]);
        }

        var (header, rows) = csv.Value;
        if (!Utils.HasColumns(header, CityCsvHeader.Split(';')))
        {
            return Utils.CsvErrors([$"Line 1: the columns must be {CityCsvHeader}."]);
        }

        var errors = new List<string>();
        var cities = new List<City>();
        var ids = new HashSet<int>();
        var keys = new HashSet<(string, string)>();
        foreach (var row in rows)
        {
            if (row.Fields.Length != 5)
            {
                errors.Add($"Line {row.Line}: expected 5 columns, found {row.Fields.Length}.");
                continue;
            }

            var f = row.Fields.Select(x => x.Trim()).ToArray();
            int id = 0;
            if (f[0] != "" && (!int.TryParse(f[0], out id) || id < 1))
                errors.Add($"Line {row.Line}: the id \"{f[0]}\" is not a positive number.");
            else if (f[0] != "" && !ids.Add(id))
                errors.Add($"Line {row.Line}: id {id} appears twice.");
            else if (!IsZipCode(f[1]))
                errors.Add($"Line {row.Line}: the postcode \"{f[1]}\" must have four digits.");
            else if (f[2] is "" or { Length: > 300 })
                errors.Add($"Line {row.Line}: the name is required (at most 300 characters).");
            else if (!int.TryParse(f[3], out var number) || number is < 10000 or > 99999)
                errors.Add($"Line {row.Line}: the Gemeindekennziffer \"{f[3]}\" must have five digits.");
            else if (!int.TryParse(f[4], out var districtNumber) || !districtIds.TryGetValue(districtNumber, out var districtId))
                errors.Add($"Line {row.Line}: district {f[4]} not found.");
            else if (!keys.Add((f[1], f[2].ToLowerInvariant())))
                errors.Add($"Line {row.Line}: {f[1]} {f[2]} appears twice.");
            else
                cities.Add(new City { Id = id, ZipCode = f[1], Name = f[2], Number = number, DistrictId = districtId });
        }

        if (errors.Count > 0) return Utils.CsvErrors(errors);
        if (cities.Count == 0) return Utils.CsvErrors(["The file has no towns."]);

        await using var transaction = await context.Database.BeginTransactionAsync();

        // Rows with a kept id first, then the sequence moves past them, then the rows without one.
        context.Cities.AddRange(cities.Where(c => c.Id != 0));
        await context.SaveChangesAsync();
        await context.Database.ExecuteSqlRawAsync(
            """SELECT setval(pg_get_serial_sequence('"Cities"', 'Id'), (SELECT COALESCE(MAX("Id"), 0) + 1 FROM "Cities"), false)""");
        context.Cities.AddRange(cities.Where(c => c.Id == 0));
        await context.SaveChangesAsync();

        await transaction.CommitAsync();
        return Results.Ok(new Utils.CsvImportResultDto(cities.Count));
    }

    // ---- DTOs ----

    public record KioskCityDto(int Id, string Name, string ZipCode);

    public record DistrictDto(int Id, int Number, string Name, int CityCount);

    public record SaveDistrictDto(
        [Range(100, 999)] int Number,
        [Required, MaxLength(100)] string Name
    );

    public record CityDto(int Id, string ZipCode, string Name, int Number, int DistrictId, int VisitorCount);

    public record SaveCityDto(
        [Required, MaxLength(4)] string ZipCode,
        [Required, MaxLength(300)] string Name,
        [Range(10000, 99999)] int Number,
        int DistrictId
    );
}
