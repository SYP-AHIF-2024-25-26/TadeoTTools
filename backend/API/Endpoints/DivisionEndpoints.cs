using Database.Entities;
using Microsoft.AspNetCore.Mvc;
using Database.Repository;
using Database.Repository.Functions;

namespace API.Endpoints;

public static class DivisionEndpoints
{
    public static void MapDivisionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");
        group.MapGet("divisions", GetDivisions);
        group.MapPost("api/divisions", CreateDivision).DisableAntiforgery();
        group.MapDelete("api/divisions/{divisionId}", DeleteDivisionById);
        group.MapPut("api/divisions", UpdateDivision).DisableAntiforgery();
        group.MapGet("divisions/{divisionId}/image", GetImageByDivisionId).DisableAntiforgery();
    }

    public static async Task<IResult> GetDivisions(TadeoTDbContext context)
    {
        return Results.Ok(await DivisionFunctions.GetAllDivisionsWithoutImageAsync(context));
    }

    public record CreateDivisionDto(string Name, string Color, IFormFile Image);

    public static async Task<IResult> CreateDivision(TadeoTDbContext context, [FromForm] CreateDivisionDto dto)
    {
        using var memoryStream = new MemoryStream();
        await dto.Image.CopyToAsync(memoryStream);
        if (dto.Name.Length > 255)
        {
            return Results.BadRequest("Division name must be less than 255 characters.");
        }

        if (dto.Color.Length > 7)
        {
            return Results.BadRequest("Color must be less than 8 characters.");
        }


        var division = new Division()
        {
            Name = dto.Name,
            Color = dto.Color,
            Image = memoryStream.ToArray()
        };
        context.Divisions.Add(division);
        await context.SaveChangesAsync();
        return Results.Ok(division);
    }

    public record UpdateDivisionDto(int Id, string Name, string Color, bool UpdateImage, IFormFile Image);

    public static async Task<IResult> UpdateDivision(TadeoTDbContext context, [FromForm] UpdateDivisionDto dto)
    {
        if (dto.Name.Length > 255)
        {
            return Results.BadRequest("Division name must be less than 255 characters.");
        }

        if (dto.Color.Length > 7)
        {
            return Results.BadRequest("Color must be less than 8 characters.");
        }


        var division = await context.Divisions.FindAsync(dto.Id);
        if (division == null)
        {
            return Results.NotFound();
        }

        if (dto.UpdateImage)
        {
            using var memoryStream = new MemoryStream();
            await dto.Image.CopyToAsync(memoryStream);
            division.Image = memoryStream.ToArray();
        }

        division.Name = dto.Name;
        division.Color = dto.Color;

        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public static async Task<IResult> DeleteDivisionById(TadeoTDbContext context, int divisionId)
    {
        var division = await context.Divisions.FindAsync(divisionId);
        if (division == null)
        {
            return Results.NotFound();
        }
        context.Divisions.Remove(division);
        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public static async Task<IResult> GetImageByDivisionId(TadeoTDbContext context, int divisionId)
    {
        var division = await context.Divisions.FindAsync(divisionId);
        if (!await DivisionFunctions.DoesDivisionExistAsync(context, divisionId))
        {
            return Results.NotFound();
        }
        var image = await DivisionFunctions.GetImageOfDivision(context, divisionId);
        if (image != null)
        {
            return Results.File(image, "image/png");
        }

        return Results.NotFound();

    }
}