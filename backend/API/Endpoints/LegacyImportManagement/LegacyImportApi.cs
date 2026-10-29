namespace API.Endpoints.LegacyImportManagement;

public static class LegacyImportApi
{
    public static void MapLegacyImportEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");

        group.MapPost("api/legacy-import/buffet", LegacyImportEndpoints.ImportBuffet)
            .WithName(nameof(LegacyImportEndpoints.ImportBuffet))
            .WithDescription("Import products, buffets and menus from the legacy backend into empty tables, keeping the legacy ids")
            .Produces<LegacyImportEndpoints.LegacyBuffetImportDto>()
            .Produces(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status502BadGateway)
            .RequireAuthorization(Setup.AdminPolicyName);
    }
}
