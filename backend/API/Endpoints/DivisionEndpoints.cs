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
        group.MapPut("api/divisions", UpdateDivision);
        group.MapPut("api/divisions/image", UpdateDivisionImage).DisableAntiforgery();
        group.MapDelete("api/divisions/{divisionId}/image", DeleteDivisionImage);
        group.MapGet("divisions/{divisionId}/image", GetImageByDivisionId).DisableAntiforgery();
        group.MapGet("api/divisions/{divisionId}/image", DeleteImage);
    }
    
    public static async Task<IResult> GetDivisions(TadeoTDbContext context)
    {
        return Results.Ok(await DivisionFunctions.GetAllDivisionsWithoutImageAsync(context));
    }

    public record CreateDivisionDto(string Name, string Color, IFormFile Image);

    public static async Task<IResult> CreateDivision(TadeoTDbContext context, [FromForm] string Name, [FromForm] string Color, [FromForm] IFormFile? Image)
    {
       
        
        if (Name.Length > 255)
        {
            return Results.BadRequest("Division name must be less than 255 characters.");
        }

        if (Color.Length > 7)
        {
            return Results.BadRequest("Color must be less than 8 characters.");
        }
        if (context.Divisions.Any(d => d.Name == Name))
        {
            return Results.BadRequest("Divisionname already exists.");
        }
        
        var division = new Division()
        {
            Name = Name,
            Color = Color,
        };
        
        if (Image is not null)
        {
            using var memoryStream = new MemoryStream();
            await Image.CopyToAsync(memoryStream);
            division.Image = memoryStream.ToArray();
        }
        context.Divisions.Add(division);
        await context.SaveChangesAsync();
        return Results.Ok(division);
    }

    public record UpdateDivisionDto(int Id, string Name, string Color);
    
    public static async Task<IResult> UpdateDivision(TadeoTDbContext context, UpdateDivisionDto dto)
    {
        if (dto.Name.Length > 255)
        {
            return Results.BadRequest("Division name must be less than 255 characters.");
        }

        if (dto.Color.Length > 7)
        {
            return Results.BadRequest("Color must be less than 8 characters.");
        }
        if (context.Divisions.Any(d => d.Name == dto.Name))
        {
            return Results.BadRequest("Divisionname already exists.");
        }


        var division = await context.Divisions.FindAsync(dto.Id);
        if (division == null)
        {
            return Results.NotFound();
        }

        division.Name = dto.Name;
        division.Color = dto.Color;

        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public record UpdateDivisionImageDto(int Id, IFormFile Image);
    
    public static async Task<IResult> UpdateDivisionImage(TadeoTDbContext context, [FromForm] UpdateDivisionImageDto dto)
    {
        var division = await context.Divisions.FindAsync(dto.Id);
        if (division == null)
        {
            return Results.NotFound();
        }

        using var memoryStream = new MemoryStream();
        await dto.Image!.CopyToAsync(memoryStream);
        division.Image = memoryStream.ToArray();
        
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
    
    private static async Task<IResult> DeleteDivisionImage(TadeoTDbContext context, int divisionId)
    {
        var division = await context.Divisions.FindAsync(divisionId);
        if (division == null)
        {
            return Results.NotFound();
        }
        
        division.Image = null;
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

    public static async Task<IResult> DeleteImage(TadeoTDbContext context, int divisionId)
    {
        var division = await context.Divisions.FindAsync(divisionId);
        if (!await DivisionFunctions.DoesDivisionExistAsync(context, divisionId))
        {
            return Results.NotFound();
        }

        division!.Image = null;
        await context.SaveChangesAsync();
        return Results.Ok();
    }
}