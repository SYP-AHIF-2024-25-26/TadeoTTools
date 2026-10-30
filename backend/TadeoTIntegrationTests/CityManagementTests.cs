using System.Net;
using System.Net.Http.Json;
using System.Text;
using Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;
using static API.Endpoints.CityManagement.CityEndpoints;
using static API.Endpoints.Utils;

namespace TadeoTIntegrationTests;

public class CityManagementTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private static StringContent Csv(string text) => new(text, Encoding.UTF8, "text/csv");

    private async Task<District> SeedDistrictAsync(int number = 401, string name = "Linz(Stadt)")
    {
        var district = new District { Number = number, Name = name };
        DbContext.Districts.Add(district);
        await DbContext.SaveChangesAsync();
        return district;
    }

    private async Task ImportLegacyAsync()
    {
        (await Client.PostAsync("/v1/api/districts/csv",
            Csv("﻿Number;Name\r\n401;Linz(Stadt)\r\n410;Linz-Land\r\n"))).EnsureSuccessStatusCode();
        (await Client.PostAsync("/v1/api/cities/csv",
            Csv("Id;ZipCode;Name;Number;DistrictNumber\r\n1040;4020;Linz;40101;401\r\n2123;4030;Linz-Ebelsberg;40101;401\r\n7;4060;Leonding;41011;410\r\n"))).EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task ImportCities_ShouldKeepIds_AndContinueAfterTheHighest()
    {
        await ImportLegacyAsync();

        var created = await Client.PostAsJsonAsync("/v1/api/cities",
            new SaveCityDto("4061", "Pasching", 41017, (await DbContext.Districts.SingleAsync(d => d.Number == 410)).Id));

        created.StatusCode.Should().Be(HttpStatusCode.OK);
        (await created.Content.ReadFromJsonAsync<CityDto>())!.Id.Should().Be(2124);
        var ids = await DbContext.Cities.OrderBy(c => c.Id).Select(c => c.Id).ToListAsync();
        ids.Should().Equal(7, 1040, 2123, 2124);
    }

    [Fact]
    public async Task ImportCities_ShouldGiveNewIds_WhenTheIdIsEmpty()
    {
        await SeedDistrictAsync();

        var response = await Client.PostAsync("/v1/api/cities/csv",
            Csv("Id;ZipCode;Name;Number;DistrictNumber\n;4020;Linz;40101;401\n50;4030;Linz-Ebelsberg;40101;401\n"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadFromJsonAsync<CsvImportResultDto>())!.Imported.Should().Be(2);
        var linz = await DbContext.Cities.SingleAsync(c => c.Name == "Linz");
        linz.Id.Should().Be(51);
    }

    [Fact]
    public async Task ImportCities_ShouldStoreNothing_AndReportLines_WhenTheFileHasErrors()
    {
        await SeedDistrictAsync();

        var response = await Client.PostAsync("/v1/api/cities/csv",
            Csv("Id;ZipCode;Name;Number;DistrictNumber\n1;4020;Linz;40101;401\n2;402;Kurz;40101;401\n3;4030;Ebelsberg;40101;325\n"));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var errors = (await response.Content.ReadFromJsonAsync<CsvImportErrorsDto>())!.Errors;
        errors.Should().HaveCount(2);
        errors[0].Should().StartWith("Line 3:");
        errors[1].Should().Be("Line 4: district 325 not found.");
        (await DbContext.Cities.AnyAsync()).Should().BeFalse();
    }

    [Fact]
    public async Task ImportCities_ShouldReturnConflict_WhenTownsExist()
    {
        await ImportLegacyAsync();

        var response = await Client.PostAsync("/v1/api/cities/csv",
            Csv("Id;ZipCode;Name;Number;DistrictNumber\n;4040;Puchenau;41612;401\n"));

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await DbContext.Cities.CountAsync()).Should().Be(3);
    }

    [Fact]
    public async Task ImportCities_ShouldAskForDistrictsFirst()
    {
        var response = await Client.PostAsync("/v1/api/cities/csv",
            Csv("Id;ZipCode;Name;Number;DistrictNumber\n1;4020;Linz;40101;401\n"));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await response.Content.ReadFromJsonAsync<CsvImportErrorsDto>())!.Errors.Single()
            .Should().Contain("districts first");
    }

    [Fact]
    public async Task ImportDistricts_ShouldReadAnsiFiles_AndQuotedFields()
    {
        var latin1 = Encoding.Latin1.GetBytes("Number;Name\r\n624;\"Südoststeiermark\"\r\n906;\"Wien  6.;Mariahilf\"\r\n");
        var content = new ByteArrayContent(latin1);
        content.Headers.ContentType = new("text/csv");

        var response = await Client.PostAsync("/v1/api/districts/csv", content);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var names = await DbContext.Districts.OrderBy(d => d.Number).Select(d => d.Name).ToListAsync();
        names.Should().Equal("Südoststeiermark", "Wien  6.;Mariahilf");
    }

    [Fact]
    public async Task ExportCities_ShouldUseTheImportFormat()
    {
        await ImportLegacyAsync();

        var bytes = await Client.GetByteArrayAsync("/v1/api/cities/csv");

        bytes.Take(3).Should().Equal(0xEF, 0xBB, 0xBF);
        var lines = Encoding.UTF8.GetString(bytes[3..]).Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries);
        lines[0].Should().Be(CityCsvHeader);
        lines[1].Should().Be("7;4060;Leonding;41011;410");
    }

    [Fact]
    public async Task GetKioskCities_ShouldReturnTheLegacyShape_SortedByName()
    {
        await ImportLegacyAsync();

        var cities = await Client.GetFromJsonAsync<List<KioskCityDto>>("/v1/cities");

        cities.Should().Equal(
            new KioskCityDto(7, "Leonding", "4060"),
            new KioskCityDto(1040, "Linz", "4020"),
            new KioskCityDto(2123, "Linz-Ebelsberg", "4030"));
    }

    [Fact]
    public async Task UpdateCity_ShouldMoveTheTownToAnotherDistrict()
    {
        await ImportLegacyAsync();
        var linzLand = await DbContext.Districts.SingleAsync(d => d.Number == 410);

        var response = await Client.PutAsJsonAsync("/v1/api/cities/2123",
            new SaveCityDto("4030", "Linz-Ebelsberg", 40101, linzLand.Id));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var districts = await Client.GetFromJsonAsync<List<DistrictDto>>("/v1/api/districts");
        districts!.Select(d => d.CityCount).Should().Equal(1, 2);
    }

    [Fact]
    public async Task CreateCity_ShouldReturnConflict_ForTheSamePostcodeAndName()
    {
        var district = await SeedDistrictAsync();
        (await Client.PostAsJsonAsync("/v1/api/cities", new SaveCityDto("4020", "Linz", 40101, district.Id)))
            .EnsureSuccessStatusCode();

        var response = await Client.PostAsJsonAsync("/v1/api/cities", new SaveCityDto("4020", "linz", 40101, district.Id));

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CreateCity_ShouldReturnBadRequest_ForAPostcodeWithoutFourDigits()
    {
        var district = await SeedDistrictAsync();

        var response = await Client.PostAsJsonAsync("/v1/api/cities", new SaveCityDto("402", "Linz", 40101, district.Id));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteDistrict_ShouldReturnConflict_WhileTownsBelongToIt()
    {
        await ImportLegacyAsync();
        var linz = await DbContext.Districts.SingleAsync(d => d.Number == 401);

        var response = await Client.DeleteAsync($"/v1/api/districts/{linz.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await response.Content.ReadAsStringAsync()).Should().Contain("2 towns belong");
    }

    [Fact]
    public async Task DeleteCity_ShouldReturnConflict_WhenARegistrationComesFromIt()
    {
        await ImportLegacyAsync();
        DbContext.Visitors.Add(new Visitor { CityId = 7, SchoolLevel = 8, CreatedAt = DateTime.UtcNow });
        await DbContext.SaveChangesAsync();

        var blocked = await Client.DeleteAsync("/v1/api/cities/7");
        var deleted = await Client.DeleteAsync("/v1/api/cities/2123");

        blocked.StatusCode.Should().Be(HttpStatusCode.Conflict);
        deleted.StatusCode.Should().Be(HttpStatusCode.OK);
        (await DbContext.Cities.CountAsync()).Should().Be(2);
    }
}
