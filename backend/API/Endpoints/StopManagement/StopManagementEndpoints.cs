using System.Text;
using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using LeoAuth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.StopManagement;

public static class StopManagementEndpoints
{
    public static async Task<IResult> GetAllStops(TadeoTDbContext context)
    {
        return Results.Ok(await StopFunctions.GetAllStopsAsync(context));
    }

    public static async Task<IResult> GetCorrelatingStops(TadeoTDbContext context, HttpContext httpContext)
    {
        var userInfo = httpContext.User.GetLeoUserInformation();

        return await userInfo.Match(
            async user =>
            {
                var username = user.Username.Match(u => u, _ => string.Empty);
                if (string.IsNullOrEmpty(username))
                    return Results.BadRequest("Username not found");

                var studentAssignments = await context.StudentAssignments
                    .Where(sa => sa.Student!.EdufsUsername == username)
                    .Select(sa => new CorrelatingStopsDto(sa.Stop!.Name, sa.Status, sa.Stop.Description, sa.Stop.RoomNr))
                    .ToListAsync();

                return Results.Ok(studentAssignments);
            },
            _ => Task.FromResult(Results.BadRequest("User information not found"))
        );
    }

    public static async Task<IResult> GetPublicStops(TadeoTDbContext context)
    {
        var stops = await context.Stops
            .Include(stop => stop.Divisions)
            .Include(stop => stop.StopGroupAssignments)
            .Where(stop => stop.StopGroupAssignments.Any(a => a.StopGroup!.IsPublic))
            .ToListAsync();

        return Results.Ok(stops.Select(stop => new StopWithGroupAssignmentsAndDivisionsDto(
            stop.Id,
            stop.Name,
            stop.RoomNr,
            stop.Description,
            stop.Divisions.Select(d => d.Id).ToArray(),
            stop.StopGroupAssignments.Select(a => a.StopGroupId).ToArray(),
            stop.StopGroupAssignments.Select(a => a.Order).ToArray()
        )).ToList());
    }

    public record StopWithGroupAssignmentsAndDivisionsDto(
        int Id,
        string Name,
        string RoomNr,
        string Description,
        int[] DivisionIds,
        int[] StopGroupIds,
        int[] Orders
    );

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
        if (stop is null)
        {
            return Results.NotFound($"Stop with ID {stopId} not found");
        }

        context.Stops.Remove(stop);
        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public static async Task<IResult> GetStopsCsv(TadeoTDbContext context)
    {
        var stops = await context.Stops
            .Include(stop => stop.Divisions)
            .Include(stop => stop.StopGroupAssignments)
            .ToListAsync();
        
        // Create CSV content
        var csvBuilder = new StringBuilder();
    
        // Add headers
        csvBuilder.AppendLine("Id;Name;Description;RoomNr;StopGroups;Divisions");
    
        // Add data rows
        foreach (var item in stops)
        {
            var escapedId = Utils.EscapeCsvField(item.Id.ToString()); // for assignments in stopgroup export
            var escapedName = Utils.EscapeCsvField(item.Name);
            var escapedDescription = Utils.EscapeCsvField(item.Description);
            var escapedRoomNr = Utils.EscapeCsvField(item.RoomNr);
            var escapedDivisions = Utils.EscapeCsvField(string.Join(",", item.Divisions.Select(d => d.Id)));
            var escapedStopGroupIds = Utils.EscapeCsvField(string.Join(",", item.StopGroupAssignments.Select(a => a.StopGroupId)));
            csvBuilder.AppendLine($"{escapedId};{escapedName};{escapedDescription};{escapedRoomNr};{escapedStopGroupIds};{escapedDivisions}");
        }
    
        var csvBytes = Encoding.UTF8.GetBytes(csvBuilder.ToString());
    
        return Results.File(
            fileContents: csvBytes,
            contentType: "text/csv",
            fileDownloadName: "stops-export.csv"
        );
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
        int Id,
        string Name,
        string Description,
        string RoomNr,
        int[] DivisionIds,
        int[] StopGroupIds
    );
    public record CorrelatingStopsDto(
        string Name,
        Status Status,
        string Description,
        string RoomNr
    );
}