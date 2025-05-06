using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using Microsoft.AspNetCore.Mvc;

namespace API.Endpoints.TeacherManagement;

public static class TeacherManagementEndpoints
{
    public static async Task<IResult> GetAllTeachers(TadeoTDbContext context)
    {
        return Results.Ok(await TeacherFunctions.GetAllTeachersAsync(context));
    }

    public static async Task<IResult> SetTeacherAssignments(TadeoTDbContext context, [FromRoute] string id, TeacherAssignment[] assignments)
    {
        var teacher = await TeacherFunctions.GetTeacherByUsernameAsync(context, id);
        if (teacher == null)
        {
            return Results.NotFound("Teacher not found");
        }

        teacher.AssignedStops.Clear();
        teacher.AssignedStops.AddRange(assignments);
        await context.SaveChangesAsync();

        return Results.Ok();
    }
}