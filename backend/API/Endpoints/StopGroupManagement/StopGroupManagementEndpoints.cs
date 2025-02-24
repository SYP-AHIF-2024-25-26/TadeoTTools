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
    
    public static async Task<IResult> GetGroupsApi(TadeoTDbContext context)
    {
        return Results.Ok(await StopGroupFunctions.GetAllStopGroupsAsync(context));
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