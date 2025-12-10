using System.ComponentModel.DataAnnotations;
using Database.Entities;
using Database.Repository;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.AdminManagement;

public class AdminManagementEndpoints
{
    public static async Task<IResult> AddAdmin(TadeoTDbContext context, AddAdminDto dto)
    {
        var admin = new Admin { Id = dto.Name };
        await context.Admins.AddAsync(admin);
        await context.SaveChangesAsync();
        return Results.Ok(admin);
    }

    public record AddAdminDto([Required, MaxLength(50)] string Name);

    public static async Task<IResult> DeleteAdmin(TadeoTDbContext context, [FromRoute] string name)
    {
        var admin = await context.Admins.FindAsync(name);
        if (admin == null)
            return Results.NotFound("Admin not found");
        context.Admins.Remove(admin);
        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public static async Task<IResult> GetAllAdmins(TadeoTDbContext context)
    {
        var admins = await context.Admins.Select(a => a.Id).ToListAsync();
        return Results.Ok(admins);
    }
}