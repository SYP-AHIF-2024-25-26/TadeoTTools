﻿using Microsoft.EntityFrameworkCore;

namespace Database.Repository.Functions;

public record DivisionDto(string Name, string Color);
public record StopGroupDto(string Name, int Order);
public record StopWithAssignmentsAndDivisionsDto(
    int Id,
    string Name,
    string RoomNr,
    string Description,
    int[] DivisionIds,
    int[] StopGroupIds
);

public class StopFunctions
{
    public static async Task<List<StopWithAssignmentsAndDivisionsDto>> GetAllStopsAsync(TadeoTDbContext context)
    {
        var stops = await context.Stops
            .Include(stop => stop.Divisions)
            .Include(stop => stop.StopGroupAssignments)
            .OrderBy(stop => stop.Name)
            .ToListAsync();

        return stops.Select(stop => new StopWithAssignmentsAndDivisionsDto(
            stop.Id,
            stop.Name,
            stop.Description,
            stop.RoomNr,
            stop.Divisions.Select(d => d.Id).ToArray(),
            stop.StopGroupAssignments.Select(a => a.StopGroupId).ToArray()
        )).ToList();
    }

    public static async Task<bool> DoesStopExistAsync(TadeoTDbContext context, int id)
    {
        return await context.Stops.SingleOrDefaultAsync(s => s.Id == id) != null;
    }
}
