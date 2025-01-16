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
        group.MapGet("divisions", GetDivisions)
            .WithName(nameof(GetDivisions))
            .WithDescription("Get all divisions without images")
            .Produces<List<DivisionFunctions.DivisionWithoutImageDto>>(StatusCodes.Status200OK);
        
        group.MapPost("api/divisions", CreateDivision)
            .AddEndpointFilter(DivisionEndpointsValidations.CreateDivisionValidationAsync)
            .WithName(nameof(CreateDivision))
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<Division>(StatusCodes.Status200OK)
            .DisableAntiforgery();

        group.MapDelete("api/divisions/{divisionId}", DeleteDivisionById)
            .AddEndpointFilter(DivisionEndpointsValidations.DeleteDivisionByIdValidationAsync)
            .WithName(nameof(DeleteDivisionById))
            .WithDescription("Delete a Division by its id")
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK);
        
        group.MapPut("api/divisions", UpdateDivision)
            .AddEndpointFilter(DivisionEndpointsValidations.UpdateDivisionValidationAsync)
            .WithName(nameof(UpdateDivision))
            .WithDescription("Update a division entity")
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK);
        
        group.MapPut("api/divisions/image", UpdateDivisionImage)
            .AddEndpointFilter(DivisionEndpointsValidations.UpdateDivisionImageValidationAsync)
            .WithName(nameof(UpdateDivisionImage))
            .WithDescription("Update the image of an division")
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK)
            .DisableAntiforgery();

        group.MapDelete("api/divisions/{divisionId}/image", DeleteDivisionImage);
        group.MapGet("divisions/{divisionId}/image", GetImageByDivisionId).DisableAntiforgery();
        group.MapGet("api/divisions/{divisionId}/image", DeleteImage);
    }

    public static async Task<IResult> GetDivisions(TadeoTDbContext context)
    {
        return Results.Ok(await DivisionFunctions.GetAllDivisionsWithoutImageAsync(context));
    }


    public static async Task<IResult> CreateDivision(TadeoTDbContext context, [FromForm] string name,
        [FromForm] string color, IFormFile? image)
    {
        var division = new Division()
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

    public record UpdateDivisionDto(int Id, string Name, string Color);

    public static async Task<IResult> UpdateDivision(TadeoTDbContext context, UpdateDivisionDto dto)
    {
        var division = await context.Divisions.FindAsync(dto.Id);

        division.Name = dto.Name;
        division.Color = dto.Color;

        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public record UpdateDivisionImageDto(int Id, IFormFile Image);

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