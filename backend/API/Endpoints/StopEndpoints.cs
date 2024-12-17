using Database.Entities;
using Database.Repository;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints;

public static class StopEndpoints
{
    public static void MapStopEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");
        group.MapGet("api/stops", GetAllStops);
        group.MapPost("api/stops", CreateStop);
        group.MapPut("api/stops", UpdateStop);
        group.MapDelete("api/stops/{stopId}", DeleteStop);
        //group.MapGet("stops/assignments", GetAssignments);
        group.MapPut("api/stops/order", UpdateOrder);
    }

    private static async Task<IResult> GetAllStops(TadeoTDbContext context)
    {
        return Results.Ok(context.Stops
            .Select(stop => new StopResponseDto(
                    stop.Id,
                    stop.Name,
                    stop.Description,
                    stop.RoomNr,
                    stop.Divisions
                        .Select(d => d.Id)
                        .ToArray(),
                    stop.StopGroupAssignments
                        .Select(a => a.StopGroupId)
                        .ToArray()
                )
            )
        );
    }


    private static async Task<IResult> CreateStop(TadeoTDbContext context, CreateStopRequestDto createStopDto)
    {
        foreach (var divisionId in createStopDto.DivisionIds)
        {
            var division = await context.Divisions.FindAsync(divisionId);
            if (division == null)
            {
                return Results.NotFound($"Division with ID {divisionId} not found");
            }
        }

        var stop = new Stop()
        {
            Name = createStopDto.Name,
            Description = createStopDto.Description,
            RoomNr = createStopDto.RoomNr,
            Divisions = context.Divisions
                .Where(d => createStopDto.DivisionIds.Contains(d.Id))
                .ToList(),
        };
        context.Stops.Add(stop);

        var groupAssignments = createStopDto.StopGroupIds
            .Select(g =>
                new StopGroupAssignment()
                {
                    StopGroupId = g,
                    StopGroup = context.StopGroups.Find(g),
                    StopId = stop.Id,
                    Stop = stop,
                    Order = 0
                })
            .Where(g => g.StopGroup != null)
            .ToList();
        if (groupAssignments.Count != createStopDto.StopGroupIds.Length)
        {
            return Results.NotFound("StopGroupId not found");
        }

        stop.StopGroupAssignments = groupAssignments;

        await context.SaveChangesAsync();
        return Results.Ok(new StopResponseDto(stop.Id, stop.Name, stop.Description, stop.RoomNr,
            createStopDto.DivisionIds, createStopDto.StopGroupIds));
    }

    // Update name, description, roomNr, divisions, stopgroups
    private static async Task<IResult> UpdateStop(TadeoTDbContext context, UpdateStopRequestDto updateStopDto)
    {
        if (updateStopDto.Name.Length == 50)
        {
            return Results.BadRequest("Name must be 50 characters or less.");
        }

        if (updateStopDto.Description.Length == 255)
        {
            return Results.BadRequest("Description must be 255 characters or less.");
        }

        if (updateStopDto.RoomNr.Length == 50)
        {
            return Results.BadRequest("RoomNr must be 50 characters or less.");
        }

        var newDivisions = context.Divisions.Where(di => updateStopDto.DivisionIds.Contains(di.Id)).ToList();
        var stop = await context.Stops
            .Include(stop => stop.Divisions)
            .SingleOrDefaultAsync(stop => stop.Id == updateStopDto.Id);
        
        if (stop == null)
        {
            return Results.NotFound($"Stop with ID {updateStopDto.Id} not found");
        }

        stop.Divisions.Clear();
        stop.Divisions.AddRange(newDivisions);
        
        stop.Name = updateStopDto.Name;
        stop.Description = updateStopDto.Description;
        stop.RoomNr = updateStopDto.RoomNr;

        await context.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> DeleteStop(TadeoTDbContext context, [FromRoute] int stopId)
    {
        var stop = await context.Stops.FindAsync(stopId);
        if (stop == null)
        {
            return Results.NotFound($"Stop with ID {stopId} not found");
        }

        context.Stops.Remove(stop);
        await context.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> GetAssignments(TadeoTDbContext context, [FromRoute] int groupId)
    {
        var stopGroups = context.StopGroupAssignments
            .Where(a => a.StopGroupId == groupId);

        var stopIds = stopGroups.Select(a => a.StopId)
            .Select(id => context.Stops.Find(id))
            .ToList();
        return Results.Ok(stopIds);
    }

    private static async Task<IResult> UpdateAssignments()
    {
        
        
        throw new NotImplementedException();
    }


    public record UpdateStopRequestDto(
        int Id,
        string Name,
        string Description,
        string RoomNr,
        int[] DivisionIds,
        int[] StopGroupIds
    );

    public record CreateStopRequestDto(
        string Name,
        string Description,
        string RoomNr,
        int[] DivisionIds,
        int[] StopGroupIds
    );

    public record StopResponseDto(
        int StopId,
        string Name,
        string Description,
        string RoomNr,
        int[] DivisionIds,
        int[] StopGroupIds
    );
}