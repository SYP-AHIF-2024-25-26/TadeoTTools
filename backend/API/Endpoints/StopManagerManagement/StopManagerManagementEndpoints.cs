using System.Text;
using System.ComponentModel.DataAnnotations;
using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using Microsoft.AspNetCore.Mvc;

namespace API.Endpoints.StopManagerManagement;

public static class StopManagerManagementEndpoints
{
    public static async Task<IResult> GetAllStopManagers(TadeoTDbContext context)
    {
        return Results.Ok(await StopManagerFunctions.GetAllStopManagersAsync(context));
    }

    public static async Task<IResult> GetStopManagerById(TadeoTDbContext context, [FromRoute] string id)
    {
        var stopManager = await StopManagerFunctions.GetStopManagerByUsernameAsync(context, id);
        return stopManager == null ? Results.NotFound("StopManager not found") : Results.Ok(stopManager);
    }

    public static async Task<IResult> SetStopManagerAssignments(TadeoTDbContext context, [FromRoute] string id,
        StopManagerAssignmentsDto[] assignments)
    {
        var stopManager = await StopManagerFunctions.GetStopManagerByUsernameAsync(context, id);
        if (stopManager == null)
        {
            return Results.NotFound("StopManager not found");
        }

        stopManager.AssignedStops.Clear();
        stopManager.AssignedStops.AddRange(assignments.Select(a => new StopManagerAssignment
        {
            StopManagerId = a.StopManagerId,
            StopId = a.StopId
        }));
        await context.SaveChangesAsync();

        return Results.Ok();
    }

    public record StopManagerAssignmentsDto(
        [Required, MaxLength(100)] string StopManagerId,
        int StopId
    );


    public static async Task<IResult> UploadCsvFile([FromForm] UploadStopManagerCsvFileDto file, TadeoTDbContext context)
    {
        if (file.File.Length <= 0) return Results.BadRequest("File upload failed");
        try
        {
            using (var stream = new MemoryStream())
            {
                await file.File.CopyToAsync(stream);
                var csvData = Encoding.UTF8.GetString(stream.ToArray());
                await StopManagerFunctions.ParseStopManagerCsv(csvData, context);
            }

            return Results.Ok("File uploaded successfully");
        }
        catch (Exception e)
        {
            return Results.BadRequest($"File upload failed: {e.Message}");
        }
    }

    public static async Task<IResult> AddStopManager(TadeoTDbContext context, AddStopManagerDto stopManagerToAdd)
    {
        var stopManager = await context.StopManagers.FindAsync(stopManagerToAdd.EdufsUsername);

        if (stopManager != null)
        {
            return Results.BadRequest("Username already exists");
        }

        var stopManagerEntity = new StopManager
        {
            EdufsUsername = stopManagerToAdd.EdufsUsername,
            FirstName = stopManagerToAdd.FirstName,
            LastName = stopManagerToAdd.LastName
        };

        context.StopManagers.Add(stopManagerEntity);
        await context.SaveChangesAsync();

        return Results.Created();
    }

    public static async Task<IResult> DeleteStopManager(TadeoTDbContext context, [FromRoute] string id)
    {
        var stopManager = await context.StopManagers.FindAsync(id);
        if (stopManager == null)
        {
            return Results.NotFound("StopManager not found");
        }

        context.StopManagers.Remove(stopManager!);
        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public static async Task<IResult> UpdateStopManager(TadeoTDbContext context, AddStopManagerDto stopManagerToUpdate)
    {
        var stopManager = await context.StopManagers.FindAsync(stopManagerToUpdate.EdufsUsername);
        if (stopManager == null)
        {
            return Results.NotFound("StopManager not found");
        }

        stopManager.FirstName = stopManagerToUpdate.FirstName;
        stopManager.LastName = stopManagerToUpdate.LastName;
        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public record UploadStopManagerCsvFileDto(IFormFile File);

    public record AddStopManagerDto(
        [Required, MaxLength(100)] string EdufsUsername,
        [Required, MaxLength(150)] string FirstName,
        [Required, MaxLength(150)] string LastName
    );
}