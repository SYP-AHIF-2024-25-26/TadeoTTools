using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints;

public static class StopGroupEndpoints
{
    public static void MapStopGroupEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");
        group.MapGet("groups", GetGroups);
        group.MapGet("api/groups", GetGroupsApi);
        group.MapPost("api/groups", CreateGroup);
        group.MapPut("api/groups", UpdateGroup);
        group.MapDelete("api/groups/{groupId}", DeleteGroup);
        group.MapPut("api/groups/order", UpdateOrder);
    }

    public record GetGroupsResponse(int Id, string Name, string Description, int Rank, int[] StopIds);

    public static async Task<IResult> GetGroups(TadeoTDbContext context)
    {
        return Results.Ok(await StopGroupFunctions.GetPublicStopGroupsAsync(context));
    }

    public static async Task<IResult> GetGroupsApi(TadeoTDbContext context)
    {
        return Results.Ok(await StopGroupFunctions.GetAllStopGroupsAsync(context));
    }

    public record CreateGroupRequestDto(string Name, string Description, bool IsPublic);
    
    public static async Task<IResult> CreateGroup(TadeoTDbContext context, CreateGroupRequestDto dto)
    {
        var group = new StopGroup()
        {
            Name = dto.Name,
            Description = dto.Description,
            IsPublic = dto.IsPublic,
        };

        context.StopGroups.Add(group);
        await context.SaveChangesAsync();
        
        return Results.Ok(group);
    }

    
    public record UpdateGroupRequestDto(int Id, string Name, string Description, bool IsPublic, int[] StopIds);
    private static async Task<IResult> UpdateGroup(TadeoTDbContext context, UpdateGroupRequestDto dto)
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
        if (!await groups.DoesStopGroupExistAsync(context, groupId))
        {
            return Results.NotFound();
        }
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
}