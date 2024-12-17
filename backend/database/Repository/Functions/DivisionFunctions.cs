﻿using Database.Entities;
using Microsoft.EntityFrameworkCore;
using System.Data.Common;

namespace Database.Repository.Functions;
public class DivisionFunctions(TadeoTDbContext context)
{
    private readonly TadeoTDbContext context = context;

    public record DivisionWithoutImageDto(int Id, string Name, string Color);
    public async Task<List<DivisionWithoutImageDto>> GetAllDivisionsWithoutImageAsync()
    {
        return await this.context.Divisions
            .Select(d => new DivisionWithoutImageDto(d.Id,d.Name, d.Color))
            .ToListAsync();
    }

    public async Task<Division?> GetDivisionById(int id)
    {
        Division? division = await this.context.Divisions
            .SingleOrDefaultAsync(d => d.Id == id);
        return division;
    }

    public async Task<Division> AddDivision(Division division)
    {
        try
        {
            this.context.Divisions.Add(division);
            await this.context.SaveChangesAsync();
            return division;
        } catch (Exception e)
        {
            var message = e.InnerException?.Message ?? e.Message;
            throw new TadeoTDatabaseException("Could not add Division: " + message);
        }
    }

    public async Task DeleteDivisionById(int id)
    {
        try
        {
            Division? division = await this.GetDivisionById(id);
            if (division == null)
            {
                throw new TadeoTNotFoundException("Could not delete Division because it was not found");
            }
            context.Divisions.Remove(division);
            await context.SaveChangesAsync();
        }
        catch (DbException e)
        {
            throw new TadeoTDatabaseException("Could not delete Division: " + e.Message);
        }

    }

    public async Task<List<Stop>> GetStopsOfDivisionId(int id)
    {
        try
        {
            return await this.context.Stops
                .Where(s => s.Divisions.Any(d => d.Id == id))
                .ToListAsync();
        } catch (Exception e)
        {
            throw new TadeoTDatabaseException("Could not get Stops: " + e.Message);
        }
    }
}