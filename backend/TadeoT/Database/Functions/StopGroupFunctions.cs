﻿using Microsoft.EntityFrameworkCore;

namespace TadeoT.Database.Functions;

public class StopGroupFunctions {
    private readonly TadeoTDbContext context = new();

    public StopGroup GetStopGroupById(int id) {
        StopGroup? group = this.context.StopGroups
            .Include(sg => sg.Stops)
            .FirstOrDefault(sg => sg.StopGroupID == id);
        return group ?? throw new TadeoTDatabaseException("StopGroup not found");
    }

    public int GetMaxId() {
        try {
            return this.context.StopGroups.Max(s => s.StopGroupID);
        } catch(Exception e) {
            throw new TadeoTDatabaseException("Could not get MaxId: " + e.Message);
        }
    }

    public void AddStopGroup(StopGroup group) {
        try {
            this.context.StopGroups.Add(group);
            this.context.SaveChanges();
        } catch (Exception e) {
            throw new TadeoTDatabaseException("Could not add StopGroup: " + e.Message);
        }
    }

    public void UpdateStopGroup(StopGroup group) {
        try {
            this.context.StopGroups.Update(group);
            this.context.SaveChanges();
        } catch (Exception e) {
            throw new TadeoTDatabaseException("Could not update StopGroup: " + e.Message);
        }
    }

    public void DeleteStopGroupById(int id) {
        try {
            StopGroup group = this.GetStopGroupById(id);
            this.context.StopGroups.Remove(group);
            this.context.SaveChanges();
        } catch (Exception e) {
            throw new TadeoTDatabaseException("Could not delete StopGroup: " + e.Message);
        }
    }

    public List<Stop> GetStopsOfStopGroup(int groupId) {
        try {
            StopGroup group = this.GetStopGroupById(groupId);
            return [.. group.Stops];
        } catch (Exception e) {
            throw new TadeoTDatabaseException("Could not get Stops: " + e.Message);
        }
    }
}

