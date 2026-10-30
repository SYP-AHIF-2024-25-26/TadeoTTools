using Database.Repository;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.RegistrationManagement;

public static class RegistrationValidations
{
    /// <summary><c>HttpContext.Items</c> key of the decoded photo for <see cref="RegistrationEndpoints.AddVisitor"/>.</summary>
    public const string PhotoItem = "VisitorPhoto";

    /// <summary>Largest photo accepted, decoded.</summary>
    private const int MaxPhotoBytes = 5 * 1024 * 1024;

    private static readonly byte[] PngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    /// <summary>400 for an unknown town or a photo that is not a PNG data URL; the kiosk shows its save error.</summary>
    public static async ValueTask<object?> AddVisitorValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var dto = context.GetArgument<RegistrationEndpoints.AddVisitorDto>(1);

        if (!await dbContext.Cities.AnyAsync(c => c.Id == dto.CityId))
        {
            return Results.BadRequest($"Town {dto.CityId} does not exist.");
        }

        if (string.IsNullOrWhiteSpace(dto.ReasonForVisit) || string.IsNullOrWhiteSpace(dto.SchoolType))
        {
            return Results.BadRequest("The reason for the visit and the school type are required.");
        }

        if (!string.IsNullOrEmpty(dto.Photo))
        {
            // "data:image/png;base64,...."; the legacy backend also took the part after the comma.
            var base64 = dto.Photo[(dto.Photo.IndexOf(',') + 1)..];
            var buffer = new byte[base64.Length * 3 / 4];
            if (!Convert.TryFromBase64String(base64, buffer, out var length) || length > MaxPhotoBytes ||
                !buffer.AsSpan(0, length).StartsWith(PngSignature))
            {
                return Results.BadRequest("The photo is not a PNG image.");
            }

            context.HttpContext.Items[PhotoItem] = buffer[..length];
        }

        return await next(context);
    }

    public static async ValueTask<object?> DoesOptionKindExistValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var kind = context.GetArgument<string>(1);

        if (!RegistrationEndpoints.OptionKinds.ContainsKey(kind))
        {
            return Results.NotFound();
        }

        return await next(context);
    }

    /// <summary>At least one entry, each 1–100 characters, none twice.</summary>
    public static async ValueTask<object?> UpdateOptionsValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var names = context.GetArgument<string[]>(2);

        if (names.Length == 0)
        {
            return Results.BadRequest("The list needs at least one entry; the kiosk asks for one.");
        }

        if (names.Any(n => string.IsNullOrWhiteSpace(n) || n.Trim().Length > 100))
        {
            return Results.BadRequest("Each entry needs a name of at most 100 characters.");
        }

        var duplicate = names
            .GroupBy(n => n.Trim(), StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault(g => g.Count() > 1);
        if (duplicate is not null)
        {
            return Results.BadRequest($"\"{duplicate.Key}\" appears twice.");
        }

        return await next(context);
    }
}
