using System.ComponentModel.DataAnnotations;
using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.MapManagement;

public static class MapEndpoints
{
    public static async Task<IResult> GetPublicMapPlaces(TadeoTDbContext context)
    {
        var places = await context.MapPlaces
            .Where(p => p.PublicLabel != null ||
                        p.Stops.Any(s => s.StopGroupAssignments.Any(a => a.StopGroup!.IsPublic)))
            .OrderBy(p => p.Code)
            .Select(p => new MapPlaceDto(p.Id, p.Floor, p.Code, p.Name, p.X, p.Y, p.PublicLabel, p.Icon,
                p.Stops.Where(s => s.StopGroupAssignments.Any(a => a.StopGroup!.IsPublic))
                    .Select(s => s.Id).ToArray()))
            .ToListAsync();
        return Results.Ok(places);
    }

    public static async Task<IResult> GetMapPlaces(TadeoTDbContext context)
    {
        var places = await context.MapPlaces
            .OrderBy(p => p.Code)
            .Select(p => new MapPlaceDto(p.Id, p.Floor, p.Code, p.Name, p.X, p.Y, p.PublicLabel, p.Icon,
                p.Stops.Select(s => s.Id).ToArray()))
            .ToListAsync();
        return Results.Ok(places);
    }

    public static async Task<IResult> CreateMapPlace(TadeoTDbContext context, SaveMapPlaceDto dto)
    {
        var place = new MapPlace { Floor = dto.Floor, Code = dto.Code };
        Apply(place, dto);
        context.MapPlaces.Add(place);
        await context.SaveChangesAsync();
        return Results.Ok(new MapPlaceDto(place.Id, place.Floor, place.Code, place.Name, place.X, place.Y,
            place.PublicLabel, place.Icon, []));
    }

    public static async Task<IResult> UpdateMapPlace(TadeoTDbContext context, [FromRoute] int placeId,
        SaveMapPlaceDto dto)
    {
        var place = await context.MapPlaces.SingleAsync(p => p.Id == placeId);
        Apply(place, dto);
        await context.SaveChangesAsync();
        return Results.Ok();
    }

    private static void Apply(MapPlace place, SaveMapPlaceDto dto)
    {
        place.Floor = dto.Floor;
        place.Code = dto.Code;
        place.Name = string.IsNullOrWhiteSpace(dto.Name) ? null : dto.Name;
        place.X = dto.X;
        place.Y = dto.Y;
        place.PublicLabel = string.IsNullOrWhiteSpace(dto.PublicLabel) ? null : dto.PublicLabel;
        place.Icon = place.PublicLabel is null ? null : dto.Icon;
    }

    public static async Task<IResult> DeleteMapPlace(TadeoTDbContext context, [FromRoute] int placeId)
    {
        await context.MapPlaces.Where(p => p.Id == placeId).ExecuteDeleteAsync();
        return Results.Ok();
    }

    public static async Task<IResult> SetPlacesOfStop(TadeoTDbContext context, [FromRoute] int stopId, int[] placeIds)
    {
        var stop = await context.Stops.Include(s => s.MapPlaces).SingleOrDefaultAsync(s => s.Id == stopId);
        if (stop is null)
        {
            return Results.NotFound($"Stop with ID {stopId} not found");
        }

        var places = await PlacesOrNullAsync(context, placeIds);
        if (places is null)
        {
            return Results.NotFound("One or more places not found");
        }

        stop.MapPlaces.Clear();
        stop.MapPlaces.AddRange(places);
        await context.SaveChangesAsync();
        return Results.Ok();
    }

    /// <summary>The places with these ids, or null if one does not exist.</summary>
    public static async Task<List<MapPlace>?> PlacesOrNullAsync(TadeoTDbContext context, int[] placeIds)
    {
        var ids = placeIds.Distinct().ToArray();
        var places = await context.MapPlaces.Where(p => ids.Contains(p.Id)).ToListAsync();
        return places.Count == ids.Length ? places : null;
    }

    public static async Task<IResult> GetMapSuggestions(TadeoTDbContext context)
    {
        var suggestions = await SuggestAsync(context);
        return Results.Ok(suggestions.Select(s => new MapSuggestionDto(s.Stop.Id, s.Stop.Name, s.Stop.RoomNr,
            s.Places.Select(p => p.Id).ToArray(), s.Places.Select(p => p.Code).ToArray())).ToList());
    }

    public static async Task<IResult> ApplyMapSuggestions(TadeoTDbContext context)
    {
        var suggestions = await SuggestAsync(context);
        foreach (var (stop, places) in suggestions)
        {
            stop.MapPlaces.AddRange(places);
        }

        await context.SaveChangesAsync();
        return Results.Ok(suggestions.Count);
    }

    private static async Task<List<(Stop Stop, List<MapPlace> Places)>> SuggestAsync(TadeoTDbContext context)
    {
        var places = await context.MapPlaces.ToListAsync();
        var stops = await context.Stops
            .Include(s => s.MapPlaces)
            .Where(s => !s.MapPlaces.Any())
            .OrderBy(s => s.Name)
            .ToListAsync();
        return stops
            .Select(stop => (Stop: stop, Places: MapFunctions.MatchRoomText(stop.RoomNr, places)))
            .Where(suggestion => suggestion.Places.Count > 0)
            .ToList();
    }

    public record MapPlaceDto(
        int Id,
        string Floor,
        string Code,
        string? Name,
        double X,
        double Y,
        string? PublicLabel,
        string? Icon,
        int[] StopIds
    );

    public record SaveMapPlaceDto(
        [Required, MaxLength(1)] string Floor,
        [Required, MaxLength(50)] string Code,
        [MaxLength(50)] string? Name,
        double X,
        double Y,
        [MaxLength(50)] string? PublicLabel,
        [MaxLength(20)] string? Icon
    );

    public record MapSuggestionDto(int StopId, string StopName, string RoomNr, int[] PlaceIds, string[] PlaceCodes);
}
