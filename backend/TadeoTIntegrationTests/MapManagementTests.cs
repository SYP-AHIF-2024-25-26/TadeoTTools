using System.Net;
using System.Net.Http.Json;
using API.Endpoints.MapManagement;
using API.Endpoints.StopManagement;
using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace TadeoTIntegrationTests;

public class MapManagementTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private const string BaseUrl = "/v1/api/map-places";

    private async Task<MapPlace> AddPlaceAsync(string code, string floor = "E", string? name = null)
    {
        var place = new MapPlace { Floor = floor, Code = code, Name = name, X = 0.5, Y = 0.5 };
        DbContext.MapPlaces.Add(place);
        await DbContext.SaveChangesAsync();
        return place;
    }

    private async Task<Stop> AddStopAsync(string name, string roomNr, bool isPublic)
    {
        var stop = new Stop { Name = name, Description = "", RoomNr = roomNr };
        var group = new StopGroup { Name = "Group " + name, Description = "", IsPublic = isPublic, Order = 0 };
        stop.StopGroupAssignments.Add(new StopGroupAssignment { Stop = stop, StopGroup = group });
        DbContext.Stops.Add(stop);
        await DbContext.SaveChangesAsync();
        return stop;
    }

    [Theory]
    [InlineData("E24", "E24")]
    [InlineData("101 (Aula - Streaming-Regieraum)", "101")]
    [InlineData("Aula E30", "E30")]
    [InlineData("E25/E22/E23", "E25,E22,E23")]
    [InlineData("U34, U35", "U34,U35")]
    [InlineData("123/122", "123,122")]
    [InlineData("U04a", "U04")]
    [InlineData("E58-1/E59-2", "E58-1,E59-2")]
    [InlineData("E58/1", "E58-1")]
    [InlineData("E53", "E54+53")]
    [InlineData("Aula UG", "U01")]
    [InlineData("Gang bis 143", "Gang bis 143")]
    [InlineData("vor 143", "")]
    [InlineData("Turnsaal", "")]
    public void MatchRoomText_ShouldFindThePlaces(string text, string expected)
    {
        var places = MapPlaceSeed.Places
            .Select(p => new MapPlace { Floor = p.Floor, Code = p.Code, Name = p.Name })
            .ToList();

        var result = MapFunctions.MatchRoomText(text, places).Select(p => p.Code);

        result.Should().Equal(expected.Split(',', StringSplitOptions.RemoveEmptyEntries));
    }

    [Fact]
    public void Seed_ShouldHaveUniqueCodesOnThePlan()
    {
        MapPlaceSeed.Places.Select(p => p.Code.ToLower()).Should().OnlyHaveUniqueItems();
        MapPlaceSeed.Places.Should().OnlyContain(p => p.X > 0 && p.X < 1 && p.Y > 0 && p.Y < 1);
    }

    [Fact]
    public async Task GetPublicMapPlaces_ShouldOnlyShowPublicStopsAndLabels()
    {
        var withPublic = await AddPlaceAsync("E24");
        var withInternal = await AddPlaceAsync("E25");
        await AddPlaceAsync("E26");
        var label = new MapPlace
            { Floor = "1", Code = "Buffet", PublicLabel = "Buffet", Icon = "buffet", X = 0.1, Y = 0.1 };
        DbContext.MapPlaces.Add(label);
        var publicStop = await AddStopAsync("Public", "E24", true);
        var internalStop = await AddStopAsync("Internal", "E25", false);
        publicStop.MapPlaces.Add(withPublic);
        internalStop.MapPlaces.Add(withInternal);
        await DbContext.SaveChangesAsync();

        var places = await Client.GetFromJsonAsync<List<MapEndpoints.MapPlaceDto>>("/v1/map-places");

        places!.Select(p => p.Code).Should().BeEquivalentTo("E24", "Buffet");
        places!.Single(p => p.Code == "E24").StopIds.Should().Equal(publicStop.Id);
    }

    [Fact]
    public async Task CreateMapPlace_ShouldReturnConflict_WhenCodeExists()
    {
        await AddPlaceAsync("E24");

        var response = await Client.PostAsJsonAsync(BaseUrl,
            new MapEndpoints.SaveMapPlaceDto("E", "e24", null, 0.2, 0.2, null, null));

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Theory]
    [InlineData("2", 0.5, null, null)]
    [InlineData("E", 1.5, null, null)]
    [InlineData("E", 0.5, "Buffet", "unknown")]
    public async Task CreateMapPlace_ShouldReturnBadRequest_WhenInvalid(string floor, double x, string? label,
        string? icon)
    {
        var response = await Client.PostAsJsonAsync(BaseUrl,
            new MapEndpoints.SaveMapPlaceDto(floor, "Neu", null, x, 0.5, label, icon));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateMapPlace_ShouldMoveThePlaceAndClearTheIconWithoutALabel()
    {
        var place = await AddPlaceAsync("E24");

        var response = await Client.PutAsJsonAsync($"{BaseUrl}/{place.Id}",
            new MapEndpoints.SaveMapPlaceDto("E", "E24", "Garten", 0.1, 0.2, " ", "buffet"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var saved = await DbContext.MapPlaces.AsNoTracking().SingleAsync(p => p.Id == place.Id);
        saved.X.Should().Be(0.1);
        saved.Name.Should().Be("Garten");
        saved.PublicLabel.Should().BeNull();
        saved.Icon.Should().BeNull();
    }

    [Fact]
    public async Task DeleteMapPlace_ShouldKeepTheStop()
    {
        var place = await AddPlaceAsync("E24");
        var stop = await AddStopAsync("Stop", "E24", true);
        stop.MapPlaces.Add(place);
        await DbContext.SaveChangesAsync();

        var response = await Client.DeleteAsync($"{BaseUrl}/{place.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await DbContext.Stops.AsNoTracking().AnyAsync(s => s.Id == stop.Id)).Should().BeTrue();
    }

    [Fact]
    public async Task SetPlacesOfStop_ShouldReturnNotFound_WhenAPlaceIsMissing()
    {
        var stop = await AddStopAsync("Stop", "E24", true);

        var response = await Client.PutAsJsonAsync($"{BaseUrl}/stops/{stop.Id}", new[] { 999 });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ApplyMapSuggestions_ShouldLinkOnlyStopsWithoutALink()
    {
        var e24 = await AddPlaceAsync("E24");
        var e25 = await AddPlaceAsync("E25");
        var linked = await AddStopAsync("Linked", "E24", true);
        linked.MapPlaces.Add(e25);
        var free = await AddStopAsync("Free", "E24/E25", true);
        await AddStopAsync("Nowhere", "Turnsaal", true);
        await DbContext.SaveChangesAsync();

        var suggestions = await Client.GetFromJsonAsync<List<MapEndpoints.MapSuggestionDto>>($"{BaseUrl}/suggestions");
        var response = await Client.PostAsync($"{BaseUrl}/suggestions/apply", null);

        suggestions!.Single().PlaceCodes.Should().Equal("E24", "E25");
        (await response.Content.ReadFromJsonAsync<int>()).Should().Be(1);
        var places = await DbContext.Stops.AsNoTracking().Where(s => s.Id == free.Id)
            .SelectMany(s => s.MapPlaces.Select(p => p.Code)).ToListAsync();
        places.Should().BeEquivalentTo(e24.Code, e25.Code);
    }

    [Fact]
    public async Task UpdateStop_ShouldKeepLinks_WhenMapPlaceIdsAreLeftOut()
    {
        var place = await AddPlaceAsync("E24");
        var stop = await AddStopAsync("Stop", "E24", true);
        stop.MapPlaces.Add(place);
        await DbContext.SaveChangesAsync();

        var keep = await Client.PutAsJsonAsync("/v1/api/stops",
            new StopManagementEndpoints.UpdateStopRequestDto(stop.Id, "Stop", "Desc", "E24", "", [], [], []));
        var kept = await DbContext.MapPlaces.AsNoTracking().CountAsync(p => p.Stops.Any(s => s.Id == stop.Id));
        var clear = await Client.PutAsJsonAsync("/v1/api/stops",
            new StopManagementEndpoints.UpdateStopRequestDto(stop.Id, "Stop", "Desc", "E24", "", [], [], [], []));
        var left = await DbContext.MapPlaces.AsNoTracking().CountAsync(p => p.Stops.Any(s => s.Id == stop.Id));

        keep.StatusCode.Should().Be(HttpStatusCode.OK);
        clear.StatusCode.Should().Be(HttpStatusCode.OK);
        kept.Should().Be(1);
        left.Should().Be(0);
    }
}
