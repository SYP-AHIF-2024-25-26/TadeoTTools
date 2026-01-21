using Database.Repository;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.FeatureFlagManagement;

public static class FeatureFlagApi
{
    public static void MapFeatureFlagEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/v1/featureflags").WithTags("Feature Flags");

        group.MapGet("/{name}", async (string name, TadeoTDbContext context) =>
        {
            var feature = await context.FeatureFlags
                .FirstOrDefaultAsync(f => EF.Functions.ILike(f.FeatureKey, name));

            if (feature == null)
            {
                return Results.Ok(false);
            }

            return Results.Ok(feature.IsEnabled);
        });

        group.MapPut("/{name}", async (string name, [FromBody] bool isEnabled, TadeoTDbContext context) =>
        {
            var feature = await context.FeatureFlags
                .FirstOrDefaultAsync(f => EF.Functions.ILike(f.FeatureKey, name));

            if (feature == null)
            {
                return Results.NotFound();
            }

            feature.IsEnabled = isEnabled;
            await context.SaveChangesAsync();

            return Results.Ok(feature.IsEnabled);
        });
    }
}
