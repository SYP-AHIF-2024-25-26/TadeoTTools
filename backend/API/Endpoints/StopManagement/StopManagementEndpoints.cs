using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.StopManagement;

public static class StopManagementEndpoints
{ 
    public static async Task<IResult> GetAllStops(TadeoTDbContext context)
    {
        return Results.Ok(await StopFunctions.GetAllStopsAsync(context));
    }
    
    public static async Task<IResult> GetPublicStops(TadeoTDbContext context)
    {
        var stops = await context.Stops
            .Include(stop => stop.Divisions)
            .Include(stop => stop.StopGroupAssignments)
            .Where(stop => stop.StopGroupAssignments.Any(a => a.StopGroup!.IsPublic))
            .ToListAsync();
        
        return Results.Ok(stops.Select(stop => new StopWithAssignmentsAndDivisionsDto(
            stop.Id,
            stop.Name,
            stop.RoomNr,
            stop.Description,
            stop.Divisions.Select(d => d.Id).ToArray(),
            stop.StopGroupAssignments.Select(a => a.StopGroupId).ToArray(),
            stop.StopGroupAssignments.Select(a => a.Order).ToArray()
        )).ToList());
    }
    
    public static async Task<IResult> CreateStop(TadeoTDbContext context, CreateStopRequestDto createStopDto)
    {
        var stop = new Stop
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
    
    public static async Task<IResult> UpdateStop(TadeoTDbContext context, UpdateStopRequestDto updateStopDto, bool? updateOrder = true)
    {

        var newDivisions = context.Divisions.Where(di => updateStopDto.DivisionIds.Contains(di.Id)).ToList();

        var stop = await context.Stops
            .Include(stop => stop.Divisions)
            .Include(stop => stop.StopGroupAssignments)
            .SingleOrDefaultAsync(stop => stop.Id == updateStopDto.Id);

        if (stop == null)
        {
            return Results.NotFound($"Stop with ID {updateStopDto.Id} not found");
        }

        if (updateOrder == null || updateOrder == true)
        {
            var assignments = updateStopDto.StopGroupIds.Select((id, index) => new StopGroupAssignment()
            {
                StopGroupId = id,
                StopGroup = context.StopGroups.Find(id),
                StopId = stop.Id,
                Stop = stop,
                Order = index
            }).ToArray();

            stop.StopGroupAssignments.Clear();
            stop.StopGroupAssignments.AddRange(assignments);
        }

        stop.Divisions.Clear();
        stop.Divisions.AddRange(newDivisions);

        stop.Name = updateStopDto.Name;
        stop.Description = updateStopDto.Description;
        stop.RoomNr = updateStopDto.RoomNr;

        await context.SaveChangesAsync();
        return Results.Ok();
    }
    
    public static async Task<IResult> DeleteStop(TadeoTDbContext context, [FromRoute] int stopId)
    {
        var stop = await context.Stops.FindAsync(stopId);

        context.Stops.Remove(stop!);
        await context.SaveChangesAsync();
        return Results.Ok();
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