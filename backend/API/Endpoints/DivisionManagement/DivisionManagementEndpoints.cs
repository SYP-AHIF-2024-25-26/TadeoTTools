using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using Microsoft.AspNetCore.Mvc;

namespace API.Endpoints.DivisionManagement;

public static class DivisionManagementEndpoints
{
    public static async Task<IResult> GetDivisions(TadeoTDbContext context)
    {
        return Results.Ok(await DivisionFunctions.GetAllDivisionsWithoutImageAsync(context));
    }
    
    public static async Task<IResult> CreateDivision(TadeoTDbContext context, [FromForm] string name,
        [FromForm] string color, IFormFile? image)
    {
        var division = new Division
        {
            Name = name,
            Color = color,
        };

        if (image is not null)
        {
            using var memoryStream = new MemoryStream();
            await image.CopyToAsync(memoryStream);
            division.Image = memoryStream.ToArray();
        }

        context.Divisions.Add(division);
        await context.SaveChangesAsync();
        return Results.Ok(division);
    }
    
    public static async Task<IResult> UpdateDivision(TadeoTDbContext context, UpdateDivisionDto dto)
    {
        var division = await context.Divisions.FindAsync(dto.Id);

        division!.Name = dto.Name;
        division.Color = dto.Color;

        await context.SaveChangesAsync();
        return Results.Ok();
    }
    
    public static async Task<IResult> UpdateDivisionImage(TadeoTDbContext context,
        [FromForm] UpdateDivisionImageDto dto)
    {
        var division = await context.Divisions.FindAsync(dto.Id);
        
        using var memoryStream = new MemoryStream();
        await dto.Image.CopyToAsync(memoryStream);
        division!.Image = memoryStream.ToArray();

        await context.SaveChangesAsync();
        return Results.Ok();
    }
    
    public static async Task<IResult> DeleteDivisionById(TadeoTDbContext context, int divisionId)
    {
        var division = await context.Divisions.FindAsync(divisionId);
        
        context.Divisions.Remove(division!);
        await context.SaveChangesAsync();
        return Results.Ok();
    }
    
    public static async Task<IResult> DeleteDivisionImage(TadeoTDbContext context, int divisionId)
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
        var image = await DivisionFunctions.GetImageOfDivision(context, divisionId);
        
        return image != null ? Results.File(image, "image/png") : Results.NotFound();
    }
    
    public static async Task<IResult> DeleteImage(TadeoTDbContext context, int divisionId)
    {
        var division = await context.Divisions.FindAsync(divisionId);

        division!.Image = null;
        await context.SaveChangesAsync();
        return Results.Ok();
    }
    
    public record UpdateDivisionDto(int Id, string Name, string Color);
    public record UpdateDivisionImageDto(int Id, IFormFile Image);
}