using System.Net;
using System.Net.Http.Json;
using System.Text;
using Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;
using static API.Endpoints.RegistrationManagement.RegistrationEndpoints;
using static API.Endpoints.Utils;

namespace TadeoTIntegrationTests;

public class RegistrationManagementTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    /// <summary>The smallest valid PNG header; the backend only checks the signature.</summary>
    private static readonly string PngDataUrl =
        "data:image/png;base64," + Convert.ToBase64String([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3]);

    private async Task<City> SeedCityAsync()
    {
        var city = new City
        {
            Id = 7, ZipCode = "4060", Name = "Leonding", Number = 41011,
            District = new District { Number = 410, Name = "Linz-Land" },
        };
        DbContext.Cities.Add(city);
        await DbContext.SaveChangesAsync();
        Factory.Photos.DeleteAll();
        return city;
    }

    private static AddVisitorDto Visitor(int cityId, Gender gender = Gender.Female, string? photo = null) =>
        new(gender, 2, cityId, "Mittelschule", 8, "Messe Wels",
            true, null, true, null, null, null, null, null, null, photo);

    private Visitor StoredVisitor(int cityId, DateTime createdAt, Gender gender = Gender.Male) => new()
    {
        CityId = cityId, CreatedAt = createdAt, Gender = gender, SchoolLevel = 8,
        SchoolType = "AHS", ReasonForVisit = "Internet", InterestedInInformatik = true, RegisteredBy = "if200001",
    };

    [Fact]
    public async Task AddVisitor_ShouldStoreTheVisitor_InUtc_WithoutPhoto()
    {
        var city = await SeedCityAsync();

        var response = await Client.PostAsJsonAsync("/v1/visitors", Visitor(city.Id, Gender.NotStated));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var id = await response.Content.ReadFromJsonAsync<int>();
        var visitor = await DbContext.Visitors.SingleAsync();
        visitor.Id.Should().Be(id);
        visitor.Gender.Should().Be(Gender.NotStated);
        visitor.InterestedInInformatik.Should().BeTrue();
        visitor.InterestedInMedientechnik.Should().BeFalse();
        visitor.HasPhoto.Should().BeFalse();
        visitor.CreatedAt.Kind.Should().Be(DateTimeKind.Utc);
        visitor.RegisteredBy.Should().Be("admin"); // the username of FakePolicyEvaluator
        Factory.Photos.Files().Should().BeEmpty();
    }

    [Fact]
    public async Task AddVisitor_ShouldWriteThePhoto_NamedByTheId()
    {
        var city = await SeedCityAsync();

        var response = await Client.PostAsJsonAsync("/v1/visitors", Visitor(city.Id, photo: PngDataUrl));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await DbContext.Visitors.SingleAsync()).HasPhoto.Should().BeTrue();
        Factory.Photos.Files().Select(Path.GetFileName).Should().Equal("Visitor_0001.png");

        var names = await Client.GetFromJsonAsync<List<string>>("/v1/visitor-photos");
        names.Should().Equal("Visitor_0001.png");
        var file = await Client.GetByteArrayAsync("/v1/visitor-photos/Visitor_0001.png");
        file.Should().HaveCount(11);
    }

    [Fact]
    public async Task AddVisitor_ShouldReturnBadRequest_ForAPhotoThatIsNoPng()
    {
        var city = await SeedCityAsync();
        var jpeg = "data:image/jpeg;base64," + Convert.ToBase64String([0xFF, 0xD8, 0xFF, 0xE0]);

        var response = await Client.PostAsJsonAsync("/v1/visitors", Visitor(city.Id, photo: jpeg));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await DbContext.Visitors.AnyAsync()).Should().BeFalse();
    }

    [Fact]
    public async Task AddVisitor_ShouldRemoveTheVisitor_WhenThePhotoCannotBeWritten()
    {
        var city = await SeedCityAsync();
        // A folder with the photo's name makes writing the file fail.
        var blocker = Path.Combine(Factory.Photos.Folder, "Visitor_0001.png");
        Directory.CreateDirectory(blocker);
        try
        {
            var response = await Client.PostAsJsonAsync("/v1/visitors", Visitor(city.Id, photo: PngDataUrl));

            response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
            (await DbContext.Visitors.AnyAsync()).Should().BeFalse();
        }
        finally
        {
            Directory.Delete(blocker);
        }
    }

    [Fact]
    public async Task AddVisitor_ShouldReturnBadRequest_ForAnUnknownTown()
    {
        await SeedCityAsync();

        var response = await Client.PostAsJsonAsync("/v1/visitors", Visitor(999));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AddVisitor_ShouldReturnBadRequest_ForTooManyAdults()
    {
        var city = await SeedCityAsync();

        var response = await Client.PostAsJsonAsync("/v1/visitors", Visitor(city.Id) with { Adults = 5 });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetVisitorStatistics_ShouldCountHoursInViennaTime_AcrossMidnight()
    {
        var city = await SeedCityAsync();
        DbContext.Visitors.AddRange(
            // 20.11. 14:10 and 14:50 in Vienna (UTC+1), 21.11. 00:30 in Vienna = 20.11. 23:30 UTC
            StoredVisitor(city.Id, new DateTime(2026, 11, 20, 13, 10, 0, DateTimeKind.Utc)),
            StoredVisitor(city.Id, new DateTime(2026, 11, 20, 13, 50, 0, DateTimeKind.Utc), Gender.Female),
            StoredVisitor(city.Id, new DateTime(2026, 11, 20, 23, 30, 0, DateTimeKind.Utc), Gender.NotStated));
        await DbContext.SaveChangesAsync();

        var statistics = await Client.GetFromJsonAsync<VisitorStatisticsDto>("/v1/visitor-statistics");

        statistics!.Count.Should().Be(new VisitorCountDto(3, 0));
        statistics.ByTime.Should().Equal(
            new VisitorHourDto(new DateOnly(2026, 11, 20), 14, 2),
            new VisitorHourDto(new DateOnly(2026, 11, 21), 0, 1));
        statistics.Gender.Should().Equal(
            new VisitorResultDto("Männlich", 1),
            new VisitorResultDto("Weiblich", 1),
            new VisitorResultDto("keine Angabe", 1));
        statistics.Departments[0].Should().Be(new VisitorResultDto("Informatik", 3));
        statistics.Districts.Should().Equal(new VisitorResultDto("Linz-Land", 3)); // registrations, not towns
        statistics.SchoolTypes.Should().Equal(new VisitorResultDto("AHS", 3));
    }

    [Fact]
    public async Task UpdateRegistrationOptions_ShouldReplaceTheList_InOrder()
    {
        DbContext.RegistrationOptions.Add(new RegistrationOption { Kind = RegistrationOptionKind.SchoolType, Name = "AHS", Order = 1 });
        await DbContext.SaveChangesAsync();

        var response = await Client.PutAsJsonAsync("/v1/api/registration-options/reasons-for-visit",
            new[] { "Freunde", "Messe Wels" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var options = await Client.GetFromJsonAsync<RegistrationOptionsDto>("/v1/registration-options");
        options!.ReasonsForVisit.Should().Equal("Freunde", "Messe Wels");
        options.SchoolTypes.Should().Equal("AHS");
    }

    [Fact]
    public async Task UpdateRegistrationOptions_ShouldReturnBadRequest_ForADuplicate()
    {
        var response = await Client.PutAsJsonAsync("/v1/api/registration-options/school-types",
            new[] { "AHS", "ahs " });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateRegistrationOptions_ShouldReturnNotFound_ForAnUnknownList()
    {
        var response = await Client.PutAsJsonAsync("/v1/api/registration-options/hobbies", new[] { "Lesen" });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ImportRegistrationOptions_ShouldSortByTheOrderColumn()
    {
        var response = await Client.PostAsync("/v1/api/registration-options/school-types/csv",
            new StringContent("﻿Order;Name\r\n2;AHS\r\n1;Mittelschule\r\n", Encoding.UTF8, "text/csv"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadFromJsonAsync<CsvImportResultDto>())!.Imported.Should().Be(2);
        var options = await Client.GetFromJsonAsync<RegistrationOptionsDto>("/v1/registration-options");
        options!.SchoolTypes.Should().Equal("Mittelschule", "AHS");

        var again = await Client.PostAsync("/v1/api/registration-options/school-types/csv",
            new StringContent("Order;Name\n1;HTL\n", Encoding.UTF8, "text/csv"));
        again.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task DeleteVisitors_ShouldDeleteTheRowsAndThePhotoFiles()
    {
        var city = await SeedCityAsync();
        (await Client.PostAsJsonAsync("/v1/visitors", Visitor(city.Id, photo: PngDataUrl))).EnsureSuccessStatusCode();
        (await Client.PostAsJsonAsync("/v1/visitors", Visitor(city.Id))).EnsureSuccessStatusCode();

        var summary = await Client.GetFromJsonAsync<VisitorSummaryDto>("/v1/api/visitors/summary");
        var response = await Client.DeleteAsync("/v1/api/visitors");

        summary.Should().Be(new VisitorSummaryDto(2, 4, 1));
        (await response.Content.ReadFromJsonAsync<DeleteVisitorsResultDto>()).Should().Be(new DeleteVisitorsResultDto(2, 1));
        (await DbContext.Visitors.AnyAsync()).Should().BeFalse();
        Factory.Photos.Files().Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteVisitors_ShouldStartTheIdsAgainAt1()
    {
        var city = await SeedCityAsync();
        (await Client.PostAsJsonAsync("/v1/visitors", Visitor(city.Id))).EnsureSuccessStatusCode();
        (await Client.PostAsJsonAsync("/v1/visitors", Visitor(city.Id))).EnsureSuccessStatusCode();

        (await Client.DeleteAsync("/v1/api/visitors")).EnsureSuccessStatusCode();
        var response = await Client.PostAsJsonAsync("/v1/visitors", Visitor(city.Id, photo: PngDataUrl));

        (await response.Content.ReadFromJsonAsync<int>()).Should().Be(1);
        Factory.Photos.Files().Select(Path.GetFileName).Should().Equal("Visitor_0001.png");
    }

    [Fact]
    public async Task DeleteVisitorPhotos_ShouldKeepTheRegistrations()
    {
        var city = await SeedCityAsync();
        (await Client.PostAsJsonAsync("/v1/visitors", Visitor(city.Id, photo: PngDataUrl))).EnsureSuccessStatusCode();

        var zip = await Client.GetByteArrayAsync("/v1/api/visitor-photos/zip");
        var response = await Client.DeleteAsync("/v1/api/visitor-photos");

        zip.Take(2).Should().Equal((byte)'P', (byte)'K');
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var visitor = await DbContext.Visitors.AsNoTracking().SingleAsync();
        visitor.HasPhoto.Should().BeFalse();
        Factory.Photos.Files().Should().BeEmpty();
        (await Client.GetFromJsonAsync<List<string>>("/v1/visitor-photos")).Should().BeEmpty();
    }

    [Fact]
    public async Task GetVisitorPhotoIndex_ShouldListOnlyPhotos_NewestFirst()
    {
        var city = await SeedCityAsync();
        var createdAt = new DateTime(2026, 11, 20, 9, 0, 0, DateTimeKind.Utc);
        for (var i = 0; i < 4; i++)
        {
            var visitor = StoredVisitor(city.Id, createdAt.AddMinutes(i));
            visitor.HasPhoto = i != 2;
            DbContext.Visitors.Add(visitor);
        }
        await DbContext.SaveChangesAsync();

        var all = await Client.GetFromJsonAsync<List<VisitorPhotoDto>>("/v1/api/visitor-photos");

        all.Should().Equal(
            new VisitorPhotoDto(4, "Visitor_0004.png", createdAt.AddMinutes(3)),
            new VisitorPhotoDto(2, "Visitor_0002.png", createdAt.AddMinutes(1)),
            new VisitorPhotoDto(1, "Visitor_0001.png", createdAt));
        all![0].CreatedAt.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Fact]
    public async Task GetVisitorsCsv_ShouldWriteViennaTime_AndTheTown()
    {
        var city = await SeedCityAsync();
        DbContext.Visitors.Add(StoredVisitor(city.Id, new DateTime(2026, 11, 20, 13, 10, 0, DateTimeKind.Utc)));
        await DbContext.SaveChangesAsync();

        var bytes = await Client.GetByteArrayAsync("/v1/api/visitors/csv");

        var lines = Encoding.UTF8.GetString(bytes[3..]).Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries);
        lines.Should().HaveCount(2);
        lines[1].Should().StartWith("1;20.11.2026;14:10:00;männlich;0;4060;Leonding;Linz-Land;AHS;8;Internet;ja;nein");
        lines[1].Should().EndWith(";if200001");
    }
}
