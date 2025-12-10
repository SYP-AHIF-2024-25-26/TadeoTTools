using System.ComponentModel.DataAnnotations;
using Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Database.Repository.Functions;

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
            stop.RoomNr,
            stop.Description,
            stop.Divisions.Select(d => d.Id).ToArray(),
            stop.StopGroupAssignments.Select(a => a.StopGroupId).ToArray(),
            stop.StopGroupAssignments.Select(a => a.Order).ToArray()
        )).ToList();
    }

    public static async Task<bool> DoesStopExistAsync(TadeoTDbContext context, int id)
    {
        return await context.Stops.SingleOrDefaultAsync(s => s.Id == id) != null;
    }
}

public record StopWithAssignmentsAndDivisionsDto(
    int Id,
    string Name,
    string RoomNr,
    string Description,
    int[] DivisionIds,
    int[] StopGroupIds,
    int[] Orders
);

public record StopWithEverythingDto(
    int Id,
    string Name,
    string RoomNr,
    string Description,
    int[] DivisionIds,
    int[] StopGroupIds,
    int[] Orders,
    StudentOfStopDto[] StudentAssignments,
    string[] TeacherAssignments
);

public record StudentOfStopDto(
    [Required, MaxLength(50)] string EdufsUsername,
    Status Status
);