namespace API.Endpoints.VersionManagement;

public static class VersionApi
{
    public static void MapVersionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");

        group.MapGet("api/version", VersionEndpoints.GetVersion)
            .WithName(nameof(VersionEndpoints.GetVersion))
            .WithDescription("The version of the running backend image")
            .Produces<VersionEndpoints.VersionDto>()
            .RequireAuthorization(Setup.AdminPolicyName);
    }
}
