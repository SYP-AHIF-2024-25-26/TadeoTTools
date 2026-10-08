namespace API.Endpoints.OverviewManagement;

public static class OverviewApi
{
    public static void MapOverviewEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");

        group.MapGet("api/overview", OverviewEndpoints.GetOverview)
            .WithName(nameof(OverviewEndpoints.GetOverview))
            .WithDescription("Readiness figures for the admin overview: counts, student states, the tour and per-stop gaps")
            .Produces<OverviewEndpoints.OverviewDto>()
            .RequireAuthorization(Setup.AdminPolicyName);
    }
}
