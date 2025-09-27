using System.Text;
using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;
using LeoAuth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.StopManagement;

public static class StopManagementEndpoints
{
    public static async Task<IResult> GetAllStops(TadeoTDbContext context)
    {
        return Results.Ok(await StopFunctions.GetAllStopsAsync(context));
    }
    
    public static async Task<IResult> GetStopById(TadeoTDbContext context, [FromRoute] int stopId)
    {
        var stop = await context.Stops
            .Include(s => s.Divisions)
            .Include(s => s.StopGroupAssignments)
            .ThenInclude(sg => sg.StopGroup)
            .Include(stop => stop.StudentAssignments)
            .Include(stop => stop.TeacherAssignments)
            .FirstOrDefaultAsync(s => s.Id == stopId);
        if (stop == null)
        {
            return Results.NotFound($"Stop with ID {stopId} not found");
        }

        var result = new StopWithEverythingDto(
            stop.Id,
            stop.Name,
            stop.RoomNr,
            stop.Description,
            stop.Divisions.Select(d => d.Id).ToArray(),
            stop.StopGroupAssignments.Select(a => a.StopGroupId).ToArray(),
            stop.StopGroupAssignments.Select(a => a.Order).ToArray(),
            stop.StudentAssignments.Select(sa => new StudentOfStopDto(sa.StudentId, sa.Status)).ToArray(),
            stop.TeacherAssignments.Select(ta => ta.TeacherId).ToArray()
        );

        return Results.Ok(result);
    }

    public static async Task<IResult> GetCorrelatingStops(TadeoTDbContext context, HttpContext httpContext)
    {
        var userInfo = httpContext.User.GetLeoUserInformation();

        return await userInfo.Match(
            async user =>
            {
                var username = user.Username.Match(u => u, _ => string.Empty);
                if (string.IsNullOrEmpty(username))
                    return Results.BadRequest("Username not found");

                var studentAssignments = await context.StudentAssignments
                    .Where(sa => sa.Student!.EdufsUsername == username)
                    .Select(sa => new CorrelatingStopsDto(sa.Stop!.Name, sa.Status, sa.Stop.Description, sa.Stop.RoomNr))
                    .ToListAsync();

                return Results.Ok(studentAssignments);
            },
            _ => Task.FromResult(Results.BadRequest("User information not found"))
        );
    }
    
    public static async Task<IResult> GetStopsByDivisionId(TadeoTDbContext context, int divisionId)
    {
        var stops = await context.Stops
            .Where(s => s.Divisions.Any(d => d.Id == divisionId))
            .Select(s => new StopResponseDto(
                s.Id,
                s.Name,
                s.Description,
                s.RoomNr,
                s.Divisions.Select(d => d.Id).ToArray(),
                s.StopGroupAssignments.Select(a => a.StopGroupId).ToArray()
            ))
            .ToListAsync();
        return stops.Count == 0 ? Results.NotFound($"No stops found for division ID {divisionId}") : Results.Ok(stops);
    }
    
    public static async Task<IResult> GetStopsForTeacher(TadeoTDbContext context, [FromRoute] string teacherId)
    {
        var stops = await context.Stops
            .Include(stop => stop.Divisions)
            .Include(stop => stop.StopGroupAssignments)
            .Where(stop => stop.TeacherAssignments.Any(t => t.TeacherId == teacherId))
            .ToListAsync();

        return Results.Ok(stops.Select(stop => new StopOfTeacher(
            stop.Id,
            stop.Name,
            stop.RoomNr,
            stop.Description
        )).ToList());
    }
    
    public record StopOfTeacher(
        int Id,
        string Name,
        string Description,
        string RoomNr
    );

    public static async Task<IResult> GetPublicStops(TadeoTDbContext context)
    {
        var stops = await context.Stops
            .Include(stop => stop.Divisions)
            .Include(stop => stop.StopGroupAssignments)
            .Where(stop => stop.StopGroupAssignments.Any(a => a.StopGroup!.IsPublic))
            .ToListAsync();

        return Results.Ok(stops.Select(stop => new StopWithGroupAssignmentsAndDivisionsDto(
            stop.Id,
            stop.Name,
            stop.RoomNr,
            stop.Description,
            stop.Divisions.Select(d => d.Id).ToArray(),
            stop.StopGroupAssignments.Select(a => a.StopGroupId).ToArray(),
            stop.StopGroupAssignments.Select(a => a.Order).ToArray()
        )).ToList());
    }

    public record StopWithGroupAssignmentsAndDivisionsDto(
        int Id,
        string Name,
        string RoomNr,
        string Description,
        int[] DivisionIds,
        int[] StopGroupIds,
        int[] Orders
    );

    public static async Task<IResult> CreateStop(TadeoTDbContext context, CreateStopRequestDto createStopDto)
    {
        var stop = new Stop
        {
            Name = createStopDto.Name,
            Description = createStopDto.Description,
            RoomNr = createStopDto.RoomNr,
            StudentAssignments = createStopDto.StudentAssignments.Select(s => new StudentAssignment()
            {
                StudentId = s.EdufsUsername,
                Student = context.Students.Find(s.EdufsUsername),
                Status = s.Status
            }).ToList(),
            TeacherAssignments = createStopDto.TeacherAssignments.Select(t => new TeacherAssignment()
            {
                TeacherId = t,
                Teacher = context.Teachers.Find(t)
            }).ToList(),
            Divisions = context.Divisions
                .Where(d => createStopDto.DivisionIds.Contains(d.Id))
                .ToList(),
        };
        context.Stops.Add(stop);

        var groupAssignments = createStopDto.StopGroupIds
            .Select(g =>
                new StopGroupAssignment()
                {
                    StopGroupId = g,
                    StopGroup = context.StopGroups.Find(g),
                    StopId = stop.Id,
                    Stop = stop,
                    Order = 0
                })
            .Where(g => g.StopGroup != null)
            .ToList();
        if (groupAssignments.Count != createStopDto.StopGroupIds.Length)
        {
            return Results.NotFound("StopGroupId not found");
        }

        stop.StopGroupAssignments = groupAssignments;

        await context.SaveChangesAsync();
        return Results.Ok(new StopResponseDto(stop.Id, stop.Name, stop.Description, stop.RoomNr,
            createStopDto.DivisionIds, createStopDto.StopGroupIds));
    }

    public static async Task<IResult> UpdateStop(TadeoTDbContext context, UpdateStopRequestDto updateStopDto, bool? updateOrder = true)
    {
        var newDivisions = context.Divisions.Where(di => updateStopDto.DivisionIds.Contains(di.Id)).ToList();
        var newStudents = updateStopDto.StudentAssignments.Select(s => new StudentAssignment()
        {
            StudentId = s.EdufsUsername,
            Student = context.Students.Find(s.EdufsUsername),
            StopId = updateStopDto.Id,
            Stop = context.Stops.Find(updateStopDto.Id),
            Status = s.Status
        }).ToList();
        var newTeachers = updateStopDto.TeacherAssignments.Select(t => new TeacherAssignment()
        {
            TeacherId = t,
            Teacher = context.Teachers.Find(t),
            StopId = updateStopDto.Id,
            Stop = context.Stops.Find(updateStopDto.Id)
        }).ToList();
            
        var stop = await context.Stops
            .Include(stop => stop.Divisions)
            .Include(stop => stop.StopGroupAssignments)
            .Include(stop => stop.StudentAssignments)
            .Include(stop => stop.TeacherAssignments)
            .SingleOrDefaultAsync(stop => stop.Id == updateStopDto.Id);

        if (stop == null)
        {
            return Results.NotFound($"Stop with ID {updateStopDto.Id} not found");
        }

        if (updateOrder == null || updateOrder == true)
        {
            var assignments = updateStopDto.StopGroupIds.Select((id, index) => new StopGroupAssignment()
            {
                StopGroupId = id,
                StopGroup = context.StopGroups.Find(id),
                StopId = stop.Id,
                Stop = stop,
                Order = index
            }).ToArray();

            stop.StopGroupAssignments.Clear();
            stop.StopGroupAssignments.AddRange(assignments);
        }

        stop.Divisions.Clear();
        stop.Divisions.AddRange(newDivisions);
        
        stop.StudentAssignments.Clear();
        stop.StudentAssignments.AddRange(newStudents);

        stop.TeacherAssignments.Clear();
        stop.TeacherAssignments.AddRange(newTeachers);

        stop.Name = updateStopDto.Name;
        stop.Description = updateStopDto.Description;
        stop.RoomNr = updateStopDto.RoomNr;

        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public static async Task<IResult> UpdateStopAsTeacher(TadeoTDbContext context,
        UpdateStopAsTeacherRequestDto updateStopDto)
    {
        var newStudents = updateStopDto.StudentAssignments.Select(s => new StudentAssignment()
        {
            StudentId = s.EdufsUsername,
            Student = context.Students.Find(s.EdufsUsername),
            StopId = updateStopDto.Id,
            Stop = context.Stops.Find(updateStopDto.Id),
            Status = s.Status
        }).ToList();
            
        var stop = await context.Stops
            .Include(stop => stop.StudentAssignments)
            .SingleOrDefaultAsync(stop => stop.Id == updateStopDto.Id);

        if (stop == null)
        {
            return Results.NotFound($"Stop with ID {updateStopDto.Id} not found");
        }
        
        stop.StudentAssignments.Clear();
        stop.StudentAssignments.AddRange(newStudents);

        stop.Name = updateStopDto.Name;
        stop.Description = updateStopDto.Description;
        stop.RoomNr = updateStopDto.RoomNr;

        await context.SaveChangesAsync();
        return Results.Ok();
    }
    
    public static async Task<IResult> DeleteStop(TadeoTDbContext context, [FromRoute] int stopId)
    {
        var stop = await context.Stops.FindAsync(stopId);
        if (stop is null)
        {
            return Results.NotFound($"Stop with ID {stopId} not found");
        }

        context.Stops.Remove(stop);
        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public static async Task<IResult> GetStopsCsv(TadeoTDbContext context)
    {
        var stops = await context.Stops
            .Include(stop => stop.Divisions)
            .Include(stop => stop.StopGroupAssignments)
            .ThenInclude(stopGroupAssignment => stopGroupAssignment.StopGroup)
            .Include(stop => stop.TeacherAssignments)
            .ThenInclude(teacherAssignment => teacherAssignment.Teacher)
            .Include(stop => stop.StudentAssignments)
            .OrderBy(stop => stop.Name)
            .ToListAsync();
        
        // Create CSV content
        var csvBuilder = new StringBuilder();
    
        // Add headers
        csvBuilder.AppendLine("Name;Description;RoomNr;Teacher;StudentsRequested;StudentsAssigned;StopGroups;Divisions");
    
        // Add data rows
        foreach (var item in stops)
        {
            var escapedName = Utils.EscapeCsvField(item.Name);
            var escapedDescription = Utils.EscapeCsvField(item.Description);
            var escapedRoomNr = Utils.EscapeCsvField(item.RoomNr);
            var escapedTeacher = Utils.EscapeCsvField(string.Join(",", item.TeacherAssignments.Select(t => t.Teacher?.FirstName + " " + t.Teacher?.LastName)));
            var escapedStudentsRequested = Utils.EscapeCsvField(item.StudentAssignments.Count(sa => sa.Status == Status.PENDING).ToString());
            var escapedStudentsAssigned = Utils.EscapeCsvField(item.StudentAssignments.Count(sa => sa.Status == Status.ACCEPTED).ToString());
            var escapedDivisions = Utils.EscapeCsvField(string.Join(",", item.Divisions.Select(d => d.Name)));
            var escapedStopGroupNames = Utils.EscapeCsvField(string.Join(",", item.StopGroupAssignments.Select(a => a.StopGroup?.Name)));
            csvBuilder.AppendLine($"{escapedName};{escapedDescription};{escapedRoomNr};{escapedTeacher};{escapedStudentsRequested};{escapedStudentsAssigned};{escapedStopGroupNames};{escapedDivisions}");
        }
    
        var csvBytes = Encoding.UTF8.GetBytes(csvBuilder.ToString());
    
        return Results.File(
            fileContents: csvBytes,
            contentType: "text/csv",
            fileDownloadName: "stops-export.csv"
        );
    }

    public record UpdateStopRequestDto(
        int Id,
        string Name,
        string Description,
        string RoomNr,
        int[] DivisionIds,
        int[] StopGroupIds,
        StudentOfStopDto[] StudentAssignments,
        string[] TeacherAssignments
    );
    
    public record UpdateStopAsTeacherRequestDto(
        int Id,
        string Name,
        string Description,
        string RoomNr,
        StudentOfStopDto[] StudentAssignments
    );
    
    public record CreateStopRequestDto(
        string Name,
        string Description,
        string RoomNr,
        int[] DivisionIds,
        int[] StopGroupIds,
        StudentOfStopDto[] StudentAssignments,
        string[] TeacherAssignments
    );
    public record StopResponseDto(
        int Id,
        string Name,
        string Description,
        string RoomNr,
        int[] DivisionIds,
        int[] StopGroupIds
    );
    public record CorrelatingStopsDto(
        string Name,
        Status Status,
        string Description,
        string RoomNr
    );
}