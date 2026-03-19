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
                return Results.NotFound();
            }

            return Results.Ok(new GetFeatureFlagDto(
                feature.FeatureKey,
                feature.IsEnabled,
                feature.Value
            ));
        });

        group.MapPut("/{name}", async (string name, [FromBody] UpdateFeatureFlagDto dto, TadeoTDbContext context) =>
        {
            if (!dto.IsEnabled.HasValue && dto.Value == null)
            {
                return Results.BadRequest("Must provide either IsEnabled or Value to update.");
            }

            var feature = await context.FeatureFlags
                .FirstOrDefaultAsync(f => EF.Functions.ILike(f.FeatureKey, name));

            if (feature == null)
            {
                return Results.NotFound();
            }

            if (dto.IsEnabled.HasValue)
            {
                feature.IsEnabled = dto.IsEnabled.Value;
            }
            if (dto.Value != null)
            {
                feature.Value = dto.Value;
            }

            await context.SaveChangesAsync();

            return Results.NoContent();
        });
    }
    
    record GetFeatureFlagDto(string Name, bool IsEnabled, string? Value);
    
    record UpdateFeatureFlagDto(bool? IsEnabled, string? Value);
}
