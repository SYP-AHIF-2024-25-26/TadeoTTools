using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.IO.Compression;
using System.Security.Claims;
using System.Text;
using Database.Entities;
using Database.Repository;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.RegistrationManagement;

/// <summary>
/// Visitor registration at the entrance kiosk, the statistics for the hall projector and the photos
/// for the PhotoDownloader. Kiosk and tool routes need no login, as with the legacy backend.
/// </summary>
public static class RegistrationEndpoints
{
    private static readonly TimeZoneInfo Vienna = TimeZoneInfo.FindSystemTimeZoneById("Europe/Vienna");
    private static readonly CultureInfo German = CultureInfo.GetCultureInfo("de-AT");

    public const string OptionCsvHeader = "Order;Name";

    /// <summary>The route segment of each option list.</summary>
    public static readonly IReadOnlyDictionary<string, RegistrationOptionKind> OptionKinds =
        new Dictionary<string, RegistrationOptionKind>
        {
            ["reasons-for-visit"] = RegistrationOptionKind.ReasonForVisit,
            ["school-types"] = RegistrationOptionKind.SchoolType,
        };

    // ---- Registration kiosk ----

    public static async Task<IResult> GetRegistrationOptions(TadeoTDbContext context)
    {
        var options = await context.RegistrationOptions
            .OrderBy(o => o.Order)
            .ToListAsync();

        return Results.Ok(new RegistrationOptionsDto(
            options.Where(o => o.Kind == RegistrationOptionKind.ReasonForVisit).Select(o => o.Name).ToList(),
            options.Where(o => o.Kind == RegistrationOptionKind.SchoolType).Select(o => o.Name).ToList()));
    }

    public static async Task<IResult> GetVisitorCount(TadeoTDbContext context) =>
        Results.Ok(await CountAsync(context));

    /// <summary>
    /// Saves the visitor, then the photo under the new id. If the photo can't be written, the
    /// visitor is removed again and the kiosk shows its save error. Returns the id (the licence number).
    /// The photo was decoded by <see cref="RegistrationValidations.AddVisitorValidationAsync"/>.
    /// </summary>
    public static async Task<IResult> AddVisitor(TadeoTDbContext context, AddVisitorDto dto,
        VisitorPhotoStore photos, HttpContext httpContext, ILogger<VisitorPhotoStore> logger, ClaimsPrincipal user)
    {
        var image = httpContext.Items[RegistrationValidations.PhotoItem] as byte[];
        var visitor = new Visitor
        {
            CreatedAt = DateTime.UtcNow,
            Gender = dto.Gender,
            Adults = dto.Adults,
            SchoolLevel = dto.SchoolLevel,
            CityId = dto.CityId,
            ReasonForVisit = dto.ReasonForVisit,
            SchoolType = dto.SchoolType,
            InterestedInInformatik = dto.InterestedInInformatik ?? false,
            InterestedInMedientechnik = dto.InterestedInMedientechnik ?? false,
            InterestedInElektronik = dto.InterestedInElektronik ?? false,
            InterestedInMedizintechnik = dto.InterestedInMedizintechnik ?? false,
            InterestedInFachschuleInformatik = dto.InterestedInFachschuleInformatik ?? false,
            InterestedInFachschuleElektronik = dto.InterestedInFachschuleElektronik ?? false,
            InterestedInAbendschule = dto.InterestedInAbendschule ?? false,
            InterestedInKolleg = dto.InterestedInKolleg ?? false,
            Comment = dto.Comment ?? "",
            HasPhoto = image is not null,
            RegisteredBy = user.FindFirst("preferred_username")?.Value ?? "",
        };
        context.Visitors.Add(visitor);
        await context.SaveChangesAsync();

        if (image is not null)
        {
            try
            {
                await photos.WriteAsync(visitor.Id, image);
            }
            catch (Exception e) when (e is IOException or UnauthorizedAccessException)
            {
                logger.LogError(e, "Photo of visitor {VisitorId} could not be written to {Folder}", visitor.Id, photos.Folder);
                await context.Visitors.Where(v => v.Id == visitor.Id).ExecuteDeleteAsync();
                return Results.Problem("The photo could not be saved.");
            }
        }

        return Results.Ok(visitor.Id);
    }

    // ---- Statistics kiosk ----

    /// <summary>
    /// Everything the slideshow shows, in one call. Hours are Vienna time. Districts count the
    /// registrations from each district (the legacy <c>districtcount</c> counted towns instead).
    /// </summary>
    public static async Task<IResult> GetVisitorStatistics(TadeoTDbContext context)
    {
        var visitors = await context.Visitors
            .Select(v => new
            {
                v.CreatedAt,
                v.Gender,
                v.ReasonForVisit,
                v.SchoolType,
                v.InterestedInInformatik,
                v.InterestedInMedientechnik,
                v.InterestedInElektronik,
                v.InterestedInMedizintechnik,
                Fachschule = v.InterestedInFachschuleElektronik || v.InterestedInFachschuleInformatik,
                v.InterestedInAbendschule,
                v.InterestedInKolleg,
            })
            .ToListAsync();

        var districts = await context.Visitors
            .GroupBy(v => v.City!.District!.Name)
            .Select(g => new VisitorResultDto(g.Key, g.Count()))
            .ToListAsync();

        var byTime = visitors
            .Select(v => TimeZoneInfo.ConvertTimeFromUtc(v.CreatedAt, Vienna))
            .GroupBy(t => (Date: DateOnly.FromDateTime(t), t.Hour))
            .OrderBy(g => g.Key.Date)
            .ThenBy(g => g.Key.Hour)
            .Select(g => new VisitorHourDto(g.Key.Date, g.Key.Hour, g.Count()))
            .ToList();

        // The legacy category names, which the slideshow's labels and colours expect.
        List<VisitorResultDto> departments =
        [
            new("Abendschule", visitors.Count(v => v.InterestedInAbendschule)),
            new("Elektronik", visitors.Count(v => v.InterestedInElektronik)),
            new("Fachschule", visitors.Count(v => v.Fachschule)),
            new("Informatik", visitors.Count(v => v.InterestedInInformatik)),
            new("Kolleg", visitors.Count(v => v.InterestedInKolleg)),
            new("Medientechnik", visitors.Count(v => v.InterestedInMedientechnik)),
            new("Medizintechnik", visitors.Count(v => v.InterestedInMedizintechnik)),
        ];

        List<VisitorResultDto> gender =
        [
            new("Männlich", visitors.Count(v => v.Gender == Gender.Male)),
            new("Weiblich", visitors.Count(v => v.Gender == Gender.Female)),
            new("keine Angabe", visitors.Count(v => v.Gender == Gender.NotStated)),
        ];

        return Results.Ok(new VisitorStatisticsDto(
            await CountAsync(context),
            byTime,
            ByCount(departments),
            ByCount(visitors.GroupBy(v => v.ReasonForVisit).Select(g => new VisitorResultDto(g.Key, g.Count()))),
            ByCount(visitors.GroupBy(v => v.SchoolType).Select(g => new VisitorResultDto(g.Key, g.Count()))),
            ByCount(districts),
            gender.Where(g => g.Count > 0).ToList()));
    }

    private static List<VisitorResultDto> ByCount(IEnumerable<VisitorResultDto> results) =>
        results.OrderByDescending(r => r.Count).ThenBy(r => r.Category).ToList();

    // ---- PhotoDownloader ----

    /// <summary>File names of all photos; each is served at <c>/v1/visitor-photos/{name}</c>.</summary>
    public static async Task<IResult> GetVisitorPhotos(TadeoTDbContext context)
    {
        var ids = await context.Visitors
            .Where(v => v.HasPhoto)
            .OrderBy(v => v.Id)
            .Select(v => v.Id)
            .ToListAsync();

        return Results.Ok(ids.Select(VisitorPhotoStore.FileName).ToList());
    }

    // ---- Registration options (admin) ----

    /// <summary>Replaces one whole list; the array order is the order at the kiosk.</summary>
    public static async Task<IResult> UpdateRegistrationOptions(TadeoTDbContext context, string kind,
        [FromBody] string[] names)
    {
        var optionKind = OptionKinds[kind];
        await using var transaction = await context.Database.BeginTransactionAsync();

        await context.RegistrationOptions.Where(o => o.Kind == optionKind).ExecuteDeleteAsync();
        context.RegistrationOptions.AddRange(names.Select((name, index) =>
            new RegistrationOption { Kind = optionKind, Name = name, Order = index + 1 }));
        await context.SaveChangesAsync();

        await transaction.CommitAsync();
        return Results.Ok();
    }

    public static async Task<IResult> GetRegistrationOptionsCsv(TadeoTDbContext context, string kind)
    {
        var optionKind = OptionKinds[kind];
        var options = await context.RegistrationOptions
            .Where(o => o.Kind == optionKind)
            .OrderBy(o => o.Order)
            .ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine(OptionCsvHeader);
        foreach (var o in options)
        {
            csv.AppendLine($"{o.Order};{Utils.EscapeCsvField(o.Name)}");
        }

        return Results.File(Utils.ToUtf8Bom(csv.ToString()), "text/csv", $"{kind}.csv");
    }

    /// <summary>Fills one empty list from a csv file, in the file's order column; all or nothing.</summary>
    public static async Task<IResult> ImportRegistrationOptionsCsv(TadeoTDbContext context, string kind,
        HttpRequest request)
    {
        var optionKind = OptionKinds[kind];
        if (await context.RegistrationOptions.AnyAsync(o => o.Kind == optionKind))
        {
            return Results.Conflict("The list has entries already. Edit it instead of importing.");
        }

        var csv = await Utils.ReadCsvAsync(request);
        if (csv is null)
        {
            return Utils.CsvErrors(["The file is larger than 1 MB."]);
        }

        var (header, rows) = csv.Value;
        if (!Utils.HasColumns(header, OptionCsvHeader.Split(';')))
        {
            return Utils.CsvErrors([$"Line 1: the columns must be {OptionCsvHeader}."]);
        }

        var errors = new List<string>();
        var options = new List<(int Order, string Name)>();
        foreach (var row in rows)
        {
            var order = row.Fields[0].Trim();
            var name = row.Fields.ElementAtOrDefault(1)?.Trim() ?? "";

            if (row.Fields.Length != 2)
                errors.Add($"Line {row.Line}: expected 2 columns, found {row.Fields.Length}.");
            else if (!int.TryParse(order, out var n))
                errors.Add($"Line {row.Line}: the order \"{order}\" is not a number.");
            else if (name is "" or { Length: > 100 })
                errors.Add($"Line {row.Line}: the name is required (at most 100 characters).");
            else if (options.Any(o => string.Equals(o.Name, name, StringComparison.OrdinalIgnoreCase)))
                errors.Add($"Line {row.Line}: \"{name}\" appears twice.");
            else
                options.Add((n, name));
        }

        if (errors.Count > 0) return Utils.CsvErrors(errors);
        if (options.Count == 0) return Utils.CsvErrors(["The file has no entries."]);

        context.RegistrationOptions.AddRange(options
            .OrderBy(o => o.Order)
            .Select((o, index) => new RegistrationOption { Kind = optionKind, Name = o.Name, Order = index + 1 }));
        await context.SaveChangesAsync();
        return Results.Ok(new Utils.CsvImportResultDto(options.Count));
    }

    // ---- Registrations and photos (admin) ----

    public static async Task<IResult> GetVisitorSummary(TadeoTDbContext context)
    {
        var count = await CountAsync(context);
        var photoCount = await context.Visitors.CountAsync(v => v.HasPhoto);
        return Results.Ok(new VisitorSummaryDto(count.Count, count.AdultsCount, photoCount));
    }

    /// <summary>One row per registration; times in Vienna time.</summary>
    public static async Task<IResult> GetVisitorsCsv(TadeoTDbContext context)
    {
        var visitors = await context.Visitors
            .OrderBy(v => v.CreatedAt)
            .Select(v => new
            {
                Visitor = v,
                v.City!.ZipCode,
                CityName = v.City.Name,
                DistrictName = v.City.District!.Name,
            })
            .ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("Id;Datum;Uhrzeit;Geschlecht;Erwachsene;PLZ;Ort;Bezirk;Schultyp;Schulstufe;Grund;" +
                       "Informatik;Medientechnik;Elektronik;Medizintechnik;Fachschule Informatik;" +
                       "Fachschule Elektronik;Abendschule;Kolleg;Kommentar;Foto;Angemeldet von");

        foreach (var row in visitors)
        {
            var v = row.Visitor;
            var local = TimeZoneInfo.ConvertTimeFromUtc(v.CreatedAt, Vienna);
            csv.AppendLine(string.Join(";",
                v.Id,
                local.ToString("dd.MM.yyyy", German),
                local.ToString("HH:mm:ss", German),
                v.Gender switch { Gender.Male => "männlich", Gender.Female => "weiblich", _ => "keine Angabe" },
                v.Adults,
                row.ZipCode,
                Utils.EscapeCsvField(row.CityName),
                Utils.EscapeCsvField(row.DistrictName),
                Utils.EscapeCsvField(v.SchoolType),
                v.SchoolLevel,
                Utils.EscapeCsvField(v.ReasonForVisit),
                YesNo(v.InterestedInInformatik),
                YesNo(v.InterestedInMedientechnik),
                YesNo(v.InterestedInElektronik),
                YesNo(v.InterestedInMedizintechnik),
                YesNo(v.InterestedInFachschuleInformatik),
                YesNo(v.InterestedInFachschuleElektronik),
                YesNo(v.InterestedInAbendschule),
                YesNo(v.InterestedInKolleg),
                Utils.EscapeCsvField(v.Comment),
                v.HasPhoto ? VisitorPhotoStore.FileName(v.Id) : "",
                Utils.EscapeCsvField(v.RegisteredBy)));
        }

        return Results.File(Utils.ToUtf8Bom(csv.ToString()), "text/csv", "visitors.csv");
    }

    /// <summary>Deletes every registration and every photo file, as the legacy <c>deleteAll</c> did.</summary>
    /// <summary>
    /// Deletes all registrations and photos; the next registration gets id 1 again, so the
    /// licence numbers of a new open day start at 1.
    /// </summary>
    public static async Task<IResult> DeleteVisitors(TadeoTDbContext context, VisitorPhotoStore photos)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        // A kiosk saving meanwhile waits until the numbering starts again, so it can't get an id
        // the reset hands out a second time, nor lose its photo to the deletion below.
        await context.Database.ExecuteSqlRawAsync("""LOCK TABLE "Visitors" IN EXCLUSIVE MODE""");
        var visitorCount = await context.Visitors.ExecuteDeleteAsync();
        await context.Database.ExecuteSqlRawAsync(
            """SELECT setval(pg_get_serial_sequence('"Visitors"', 'Id'), 1, false)""");
        var photoCount = photos.DeleteAll();
        await transaction.CommitAsync();
        return Results.Ok(new DeleteVisitorsResultDto(visitorCount, photoCount));
    }

    public static IResult GetVisitorPhotosZip(VisitorPhotoStore photos)
    {
        using var buffer = new MemoryStream();
        using (var zip = new ZipArchive(buffer, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var file in photos.Files())
            {
                // PNGs are compressed already.
                zip.CreateEntryFromFile(file, Path.GetFileName(file), CompressionLevel.NoCompression);
            }
        }

        return Results.File(buffer.ToArray(), "application/zip", "visitor-photos.zip");
    }

    /// <summary>Deletes the photo files and keeps the registrations.</summary>
    public static async Task<IResult> DeleteVisitorPhotos(TadeoTDbContext context, VisitorPhotoStore photos)
    {
        await context.Visitors
            .Where(v => v.HasPhoto)
            .ExecuteUpdateAsync(s => s.SetProperty(v => v.HasPhoto, false));
        var photoCount = photos.DeleteAll();
        return Results.Ok(new DeleteVisitorsResultDto(0, photoCount));
    }

    private static string YesNo(bool value) => value ? "ja" : "nein";

    private static async Task<VisitorCountDto> CountAsync(TadeoTDbContext context)
    {
        var count = await context.Visitors.CountAsync();
        var adults = count == 0 ? 0 : await context.Visitors.SumAsync(v => v.Adults);
        return new VisitorCountDto(count, adults);
    }

    // ---- DTOs ----

    public record RegistrationOptionsDto(List<string> ReasonsForVisit, List<string> SchoolTypes);

    /// <summary>Same shape as the legacy <c>GET api/Visitors/count</c>.</summary>
    public record VisitorCountDto(int Count, int AdultsCount);

    /// <summary>
    /// The legacy <c>POST api/Visitors</c> body, with <see cref="Gender"/> instead of <c>isMale</c>
    /// and the photo as a PNG data URL in <see cref="Photo"/> (null without a photo).
    /// </summary>
    public record AddVisitorDto(
        Gender Gender,
        [Range(0, 4)] int Adults,
        int CityId,
        [Required, MaxLength(100)] string SchoolType,
        [Range(7, 13)] int SchoolLevel,
        [Required, MaxLength(100)] string ReasonForVisit,
        bool? InterestedInInformatik,
        bool? InterestedInMedientechnik,
        bool? InterestedInElektronik,
        bool? InterestedInMedizintechnik,
        bool? InterestedInFachschuleInformatik,
        bool? InterestedInFachschuleElektronik,
        bool? InterestedInAbendschule,
        bool? InterestedInKolleg,
        [MaxLength(100)] string? Comment,
        string? Photo
    );

    /// <summary>One bar of a statistics slide.</summary>
    public record VisitorResultDto(string Category, int Count);

    /// <summary>Registrations in one hour (Vienna time): hour 14 is 14–15 Uhr.</summary>
    public record VisitorHourDto(DateOnly Date, int Hour, int Count);

    public record VisitorStatisticsDto(
        VisitorCountDto Count,
        List<VisitorHourDto> ByTime,
        List<VisitorResultDto> Departments,
        List<VisitorResultDto> Reasons,
        List<VisitorResultDto> SchoolTypes,
        List<VisitorResultDto> Districts,
        List<VisitorResultDto> Gender);

    public record VisitorSummaryDto(int Count, int AdultsCount, int PhotoCount);

    public record DeleteVisitorsResultDto(int Visitors, int Photos);
}
