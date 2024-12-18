﻿using Microsoft.EntityFrameworkCore;
using System;
using TadeoT.Database.Model;

namespace TadeoT.Database.Functions;

public class StopFunctions(
    StopGroupFunctions stopGroupFunctions,
    DivisionFunctions divisionFunctions,
    TadeoTDbContext context
        )
{
    private readonly TadeoTDbContext context = context;
    private readonly StopGroupFunctions stopGroupFunctions = stopGroupFunctions;
    private readonly DivisionFunctions divisionFunctions = divisionFunctions;

    public async Task<List<Stop>> GetAllStops()
    {
        return await this.context.Stops
            .Include(s => s.StopGroup)
            .OrderBy(s => s.StopOrder)
            .ToListAsync();
    }

    public async Task<Stop> GetStopById(int id)
    {
        Stop? stop = await this.context.Stops
            .Include(s => s.StopGroup)
            .FirstOrDefaultAsync(s => s.StopID == id);
        return stop ?? throw new TadeoTNotFoundException("Stop not found");
    }

    public async Task<int> GetMaxId()
    {
        try
        {
            return !(await this.context.Stops.AnyAsync()) ? 0 : this.context.Stops.Max(s => s.StopID);
        } catch (Exception e)
        {
            throw new TadeoTDatabaseException("Could not get MaxId: " + e.Message);
        }
    }

    public async Task<int> AddStop(Stop stop)
    {
        if (stop == null)
        {
            throw new TadeoTArgumentNullException("Stop is null");
        }
        try
        {
            if (stop.StopGroup != null)
            {
                var existingStopGroup = await this.stopGroupFunctions.GetStopGroupById(stop.StopGroup.StopGroupID);
                stop.StopGroupID = existingStopGroup.StopGroupID;
                stop.StopGroup = null; // detach to avoid double tracking
                //this.context.Entry(stop.StopGroup).State = EntityState.Unchanged;
            }
            if (stop.Division != null)
            {
                var existingDivision = await this.divisionFunctions.GetDivisionById(stop.Division.DivisionID);
                stop.DivisionID = existingDivision.DivisionID;
                stop.Division = null;
                //this.context.Entry(stop.Division).State = EntityState.Unchanged;
            }
            this.context.Stops.Add(stop);
            await this.context.SaveChangesAsync();
            return stop.StopID;
        } catch (TadeoTNotFoundException e)
        {
            throw new TadeoTNotFoundException("Stopgroup of Stop not found, add it before" + e.Message);
        } catch (Exception)
        {
            throw new TadeoTDatabaseException("Could not add Stop");
        }
    }

    public async Task UpdateStop(Stop stop)
    {
        if (stop == null)
        {
            throw new TadeoTArgumentNullException("Stop is null");
        }
        try
        {
            await this.context
                .Stops
                .Where(s => s.StopID == stop.StopID)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(s => s.Name, stop.Name)
                    .SetProperty(s => s.Description, stop.Description)
                    .SetProperty(s => s.StopOrder, stop.StopOrder)
                    .SetProperty(s => s.StopGroupID, stop.StopGroupID)
                    .SetProperty(s => s.DivisionID, stop.DivisionID)
                );
            await this.context.SaveChangesAsync();
        } catch (Exception e)
        {
            throw new TadeoTDatabaseException("Could not update Stop: " + e.Message);
        }
    }

    public async Task DeleteStopById(int id)
    {
        try
        {
            Stop stop = await this.GetStopById(id);
            this.context.Stops.Remove(stop);
            await this.context.SaveChangesAsync();
        } catch (TadeoTNotFoundException e)
        {
            throw new TadeoTNotFoundException("Stop not found, add it before deleting" + e.Message);
        } catch (Exception e)
        {
            throw new TadeoTDatabaseException("Could not delete Stop: " + e.Message);
        }
    }

    public async Task<StopGroup?> GetStopGroupOfStop(int stopId)
    {
        try
        {
            Stop stop = await this.GetStopById(stopId);
            return stop.StopGroup;
        } catch (Exception e)
        {
            throw new TadeoTDatabaseException("Could not get StopGroup: " + e.Message);
        }
    }

    public async Task MoveStopUp(int stopId)
    {
        Stop stop = await this.GetStopById(stopId);
        if (stop == null) return;

        var aboveItem = await context.Stops
            .Where(i => i.StopOrder < stop.StopOrder)
            .OrderByDescending(i => i.StopOrder)
            .FirstOrDefaultAsync();

        if (aboveItem != null)
        {
            (aboveItem.StopOrder, stop.StopOrder) = (stop.StopOrder, aboveItem.StopOrder);
        } else
        {
            stop.StopOrder++;
        }
        await context.SaveChangesAsync();
    }

    public async Task MoveStopDown(int stopId)
    {
        Stop stop = await this.GetStopById(stopId);
        if (stop == null) return;

        var aboveItem = await context.Stops
            .Where(i => i.StopOrder > stop.StopOrder)
            .OrderByDescending(i => i.StopOrder)
            .FirstOrDefaultAsync();

        if (aboveItem != null)
        {
            (aboveItem.StopOrder, stop.StopOrder) = (stop.StopOrder, aboveItem.StopOrder);
        } else
        {
            stop.StopOrder--;
        }
        await context.SaveChangesAsync();
    }
}
