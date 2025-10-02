using System.Text;
using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.StopGroupManagement;

public static class StopGroupManagementEndpoints
{
    public static async Task<IResult> GetGroups(TadeoTDbContext context)
    {
        return Results.Ok(await StopGroupFunctions.GetPublicStopGroupsAsync(context));
    }
    
    public static async Task<IResult> GetGroupById(TadeoTDbContext context, [FromRoute] int groupId)
    {
        var group = await context.StopGroups
            .Include(g => g.StopAssignments)
            .FirstOrDefaultAsync(g => g.Id == groupId);
        if (group == null)
        {
            return Results.NotFound($"StopGroup with {groupId} not found");
        }

        var stopIds = group.StopAssignments
            .OrderBy(a => a.Order)
            .Select(a => a.StopId)
            .ToArray();

        var result = new StopGroupFunctions.StopGroupWithStops(
            group.Id,
            group.Name,
            group.Description,
            group.Rank,
            group.IsPublic,
            stopIds
        );

        return Results.Ok(result);
    }

    public static async Task<IResult> GetGroupsApi(TadeoTDbContext context)
    {
        var stopgroups = (await StopGroupFunctions.GetAllStopGroupsAsync(context)).ToList();
        stopgroups.Sort((a, b) => a.Rank.CompareTo(b.Rank));
        return Results.Ok(stopgroups);
    }

    public static async Task<IResult> CreateGroup(TadeoTDbContext context, CreateGroupRequestDto dto)
    {
        var group = new StopGroup
        {
            Name = dto.Name,
            Description = dto.Description,
            IsPublic = dto.IsPublic,
        };

        context.StopGroups.Add(group);
        await context.SaveChangesAsync();

        return Results.Ok(group);
    }

    public static async Task<IResult> UpdateGroup(TadeoTDbContext context, UpdateGroupRequestDto dto)
    {
        var group = await context.StopGroups
            .Include(g => g.StopAssignments)
            .FirstOrDefaultAsync(g => g.Id == dto.Id);
        if (group == null)
        {
            return Results.NotFound("Group not found");
        }

        group.Name = dto.Name;
        group.Description = dto.Description;
        group.IsPublic = dto.IsPublic;

        var assignments = dto.StopIds.Select((id, index) => new StopGroupAssignment()
        {
            StopGroupId = group.Id,
            StopGroup = group,
            StopId = id,
            Stop = context.Stops.Find(id),
            Order = index
        });
        group.StopAssignments.Clear();
        group.StopAssignments.AddRange(assignments);

        await context.SaveChangesAsync();

        return Results.Ok();
    }

    public static async Task<IResult> DeleteGroup(TadeoTDbContext context, StopGroupFunctions groups, [FromRoute] int groupId)
    {
        var group = await context.StopGroups.FindAsync(groupId);
        context.StopGroups.Remove(group!);
        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public static async Task<IResult> UpdateOrder(TadeoTDbContext context, StopGroupFunctions groups, [FromBody] int[] order)
    {
        for (var index = 0; index < order.Length; index++)
        {
            var groupId = order[index];
            var stopGroup = await context.StopGroups.FindAsync(groupId);
            if (stopGroup == null)
            {
                return Results.NotFound($"StopGroup {groupId} not found");
            }
            stopGroup.Rank = index;
        }

        await context.SaveChangesAsync();

        return Results.Ok();
    }

    public record CreateGroupRequestDto(string Name, string Description, bool IsPublic);
    public record UpdateGroupRequestDto(int Id, string Name, string Description, bool IsPublic, int[] StopIds);
}