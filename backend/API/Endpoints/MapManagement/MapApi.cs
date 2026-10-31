using static API.Endpoints.MapManagement.MapEndpoints;

namespace API.Endpoints.MapManagement;

public static class MapApi
{
    public static void MapMapEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");

        // GuideApp
        group.MapGet("map-places", GetPublicMapPlaces)
            .WithName(nameof(GetPublicMapPlaces))
            .WithDescription("Get the places with public stops or a public label")
            .Produces<List<MapPlaceDto>>();

        group.MapGet("api/map-places", GetMapPlaces)
            .WithName(nameof(GetMapPlaces))
            .WithDescription("Get all places with all their stops")
            .Produces<List<MapPlaceDto>>()
            .RequireAuthorization(Setup.StopManagerOrAdminPolicyName);

        group.MapPost("api/map-places", CreateMapPlace)
            .AddEndpointFilter(MapValidations.SaveMapPlaceValidationAsync)
            .WithName(nameof(CreateMapPlace))
            .Produces<MapPlaceDto>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("api/map-places/{placeId:int}", UpdateMapPlace)
            .AddEndpointFilter(MapValidations.DoesMapPlaceExistValidationAsync)
            .AddEndpointFilter(MapValidations.SaveMapPlaceValidationAsync)
            .WithName(nameof(UpdateMapPlace))
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapDelete("api/map-places/{placeId:int}", DeleteMapPlace)
            .AddEndpointFilter(MapValidations.DoesMapPlaceExistValidationAsync)
            .WithName(nameof(DeleteMapPlace))
            .WithDescription("Delete a place; its stops stay and lose this link")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("api/map-places/stops/{stopId:int}", SetPlacesOfStop)
            .WithName(nameof(SetPlacesOfStop))
            .WithDescription("Replace the places a stop is linked to")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapGet("api/map-places/suggestions", GetMapSuggestions)
            .WithName(nameof(GetMapSuggestions))
            .WithDescription("Places for the stops without a link, read from their room text")
            .Produces<List<MapSuggestionDto>>()
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("api/map-places/suggestions/apply", ApplyMapSuggestions)
            .WithName(nameof(ApplyMapSuggestions))
            .WithDescription("Link the stops without a link as suggested; returns how many were linked")
            .Produces<int>()
            .RequireAuthorization(Setup.AdminPolicyName);
    }
}
