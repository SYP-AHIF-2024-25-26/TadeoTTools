using System.Text;
using System.ComponentModel.DataAnnotations;
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
            .Include(stop => stop.StopManagerAssignments)
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
            stop.StudentAssignments.Select(sa => new StudentOfStopDto(sa.EdufsUsername, sa.Status)).ToArray(),
            stop.StopManagerAssignments.Select(ta => ta.StopManagerId).ToArray()
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

                var intermediateData = await context.StudentAssignments
                    .Where(sa => sa.Student != null && EF.Functions.ILike(sa.Student.EdufsUsername, username))
                    .Select(sa => new
                    {
                        sa.Stop!.Name,
                        sa.Status,
                        sa.Stop.Description,
                        sa.Stop.RoomNr,
                        OtherStudents = sa.Stop.StudentAssignments
                            .Where(otherSa =>
                                otherSa.Student != null && !EF.Functions.ILike(otherSa.Student.EdufsUsername, username) &&
                                otherSa.Status != Status.DECLINED)
                            .Select(otherSa => new OtherStudentOfStopDto(
                                otherSa.Student!.LastName,
                                otherSa.Student.FirstName,
                                otherSa.Student.StudentClass,
                                otherSa.Student.Department
                            ))
                    })
                    .ToListAsync();

                var studentAssignments = intermediateData
                    .Select(data => new CorrelatingStopsDto(
                        data.Name,
                        data.Status,
                        data.Description,
                        data.RoomNr,
                        data.OtherStudents
                            .OrderBy(s => s.StudentClass)
                            .ThenBy(s => s.LastName)
                            .ToList()
                    ))
                    .ToList();
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

    public static async Task<IResult> GetStopsForStopManager(TadeoTDbContext context, [FromRoute] string stopManagerId)
    {
        var stops = await context.Stops
            .Include(stop => stop.Divisions)
            .Include(stop => stop.StopGroupAssignments)
            .Where(stop => stop.StopManagerAssignments.Any(t => EF.Functions.ILike(t.StopManagerId, stopManagerId)))
            .ToListAsync();

        return Results.Ok(stops.Select(stop => new StopOfStopManager(
            stop.Id,
            stop.Name,
            stop.RoomNr,
            stop.Description
        )).ToList());
    }

    public record StopOfStopManager(
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
        var studentIds = createStopDto.StudentAssignments.Select(s => s.EdufsUsername).ToList();
        var stopManagerIds = createStopDto.StopManagerAssignments.ToList();
        var divisionIds = createStopDto.DivisionIds.ToList();
        var stopGroupIds = createStopDto.StopGroupIds.ToList();

        var students = (await context.Students
            .Where(s => studentIds.Any(id => EF.Functions.ILike(s.EdufsUsername, id)))
            .ToListAsync())
            .ToDictionary(s => s.EdufsUsername, StringComparer.OrdinalIgnoreCase);

        var stopManagers = (await context.StopManagers
            .Where(t => stopManagerIds.Any(id => EF.Functions.ILike(t.EdufsUsername, id)))
            .ToListAsync())
            .ToDictionary(t => t.EdufsUsername, StringComparer.OrdinalIgnoreCase);

        var divisions = await context.Divisions
            .Where(d => divisionIds.Contains(d.Id))
            .ToListAsync();

        var stopGroups = await context.StopGroups
            .Where(sg => stopGroupIds.Contains(sg.Id))
            .ToDictionaryAsync(sg => sg.Id);

        if (stopGroups.Count != createStopDto.StopGroupIds.Length)
        {
            return Results.NotFound("One or more StopGroupIds not found");
        }

        var stop = new Stop
        {
            Name = createStopDto.Name,
            Description = createStopDto.Description,
            RoomNr = createStopDto.RoomNr,
            StudentAssignments = createStopDto.StudentAssignments.Select(s => new StudentAssignment()
            {
                EdufsUsername = s.EdufsUsername,
                Student = students.GetValueOrDefault(s.EdufsUsername),
                Status = s.Status
            }).ToList(),
            StopManagerAssignments = createStopDto.StopManagerAssignments.Select(t => new StopManagerAssignment()
            {
                StopManagerId = t,
                StopManager = stopManagers.GetValueOrDefault(t)
            }).ToList(),
            Divisions = divisions
        };

        context.Stops.Add(stop);

        var groupAssignments = createStopDto.StopGroupIds
            .Select(g => new StopGroupAssignment()
            {
                StopGroupId = g,
                StopGroup = stopGroups[g],
                StopId = stop.Id,
                Stop = stop,
                Order = 0
            })
            .ToList();

        stop.StopGroupAssignments = groupAssignments;

        await context.SaveChangesAsync();
        return Results.Ok(new StopResponseDto(stop.Id, stop.Name, stop.Description, stop.RoomNr,
            createStopDto.DivisionIds, createStopDto.StopGroupIds));
    }

    public static async Task<IResult> UpdateStop(TadeoTDbContext context, UpdateStopRequestDto updateStopDto,
        bool? updateOrder = true)
    {
        var studentIds = updateStopDto.StudentAssignments.Select(s => s.EdufsUsername).ToList();
        var stopManagerIds = updateStopDto.StopManagerAssignments.ToList();
        var divisionIds = updateStopDto.DivisionIds.ToList();

        var students = (await context.Students
            .Where(s => studentIds.Any(id => EF.Functions.ILike(s.EdufsUsername, id)))
            .ToListAsync())
            .ToDictionary(s => s.EdufsUsername, StringComparer.OrdinalIgnoreCase);

        var stopManagers = (await context.StopManagers
            .Where(t => stopManagerIds.Any(id => EF.Functions.ILike(t.EdufsUsername, id)))
            .ToListAsync())
            .ToDictionary(t => t.EdufsUsername, StringComparer.OrdinalIgnoreCase);

        var divisions = await context.Divisions
            .Where(d => divisionIds.Contains(d.Id))
            .ToListAsync();

        var stop = await context.Stops
            .Include(s => s.Divisions)
            .Include(s => s.StopGroupAssignments)
            .Include(s => s.StudentAssignments)
            .Include(s => s.StopManagerAssignments)
            .SingleOrDefaultAsync(s => s.Id == updateStopDto.Id);

        if (stop == null)
        {
            return Results.NotFound($"Stop with ID {updateStopDto.Id} not found");
        }

        var newStudentAssignments = updateStopDto.StudentAssignments.Select(s => new StudentAssignment()
        {
            EdufsUsername = s.EdufsUsername,
            Student = students.GetValueOrDefault(s.EdufsUsername),
            StopId = updateStopDto.Id,
            Stop = stop,
            Status = s.Status
        }).ToList();

        var newStopManagerAssignments = updateStopDto.StopManagerAssignments.Select(t => new StopManagerAssignment()
        {
            StopManagerId = t,
            StopManager = stopManagers.GetValueOrDefault(t),
            StopId = updateStopDto.Id,
            Stop = stop
        }).ToList();

        stop.Divisions.Clear();
        stop.Divisions.AddRange(divisions);

        stop.StudentAssignments.Clear();
        stop.StudentAssignments.AddRange(newStudentAssignments);

        stop.StopManagerAssignments.Clear();
        stop.StopManagerAssignments.AddRange(newStopManagerAssignments);

        stop.Name = updateStopDto.Name;
        stop.Description = updateStopDto.Description;
        stop.RoomNr = updateStopDto.RoomNr;

        await context.SaveChangesAsync();
        return Results.Ok();
    }


    public static async Task<IResult> UpdateStopAsStopManager(TadeoTDbContext context,
        UpdateStopAsStopManagerRequestDto updateStopDto)
    {
        var studentIds = updateStopDto.StudentAssignments.Select(s => s.EdufsUsername).ToList();

        var students = (await context.Students
            .Where(s => studentIds.Any(id => EF.Functions.ILike(s.EdufsUsername, id)))
            .ToListAsync())
            .ToDictionary(s => s.EdufsUsername, StringComparer.OrdinalIgnoreCase);

        var stop = await context.Stops
            .Include(s => s.StudentAssignments)
            .SingleOrDefaultAsync(s => s.Id == updateStopDto.Id);

        if (stop == null)
        {
            return Results.NotFound($"Stop with ID {updateStopDto.Id} not found");
        }

        var newStudentAssignments = updateStopDto.StudentAssignments.Select(s => new StudentAssignment()
        {
            EdufsUsername = s.EdufsUsername,
            Student = students.GetValueOrDefault(s.EdufsUsername),
            StopId = updateStopDto.Id,
            Stop = stop,
            Status = s.Status
        }).ToList();

        stop.StudentAssignments.Clear();
        stop.StudentAssignments.AddRange(newStudentAssignments);

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
            .Include(stop => stop.StopManagerAssignments)
            .ThenInclude(stopManagerAssignment => stopManagerAssignment.StopManager)
            .Include(stop => stop.StudentAssignments)
            .OrderBy(stop => stop.Name)
            .ToListAsync();

        var csvBuilder = new StringBuilder();
        csvBuilder.AppendLine(
            "Name;Description;RoomNr;StopManager;StudentsRequested;StudentsAssigned;StopGroups;Divisions");

        foreach (var item in stops)
        {
            var escapedName = Utils.EscapeCsvField(item.Name);
            var escapedDescription = Utils.EscapeCsvField(item.Description);
            var escapedRoomNr = Utils.EscapeCsvField(item.RoomNr);
            var escapedStopManager = Utils.EscapeCsvField(string.Join(",",
                item.StopManagerAssignments.Select(t => t.StopManager?.FirstName + " " + t.StopManager?.LastName)));
            var escapedStudentsRequested =
                Utils.EscapeCsvField(item.StudentAssignments.Count(sa => sa.Status == Status.PENDING).ToString());
            var escapedStudentsAssigned =
                Utils.EscapeCsvField(item.StudentAssignments.Count(sa => sa.Status == Status.ACCEPTED).ToString());
            var escapedDivisions = Utils.EscapeCsvField(string.Join(",", item.Divisions.Select(d => d.Name)));
            var escapedStopGroupNames =
                Utils.EscapeCsvField(string.Join(",", item.StopGroupAssignments.Select(a => a.StopGroup?.Name)));
            csvBuilder.AppendLine(
                $"{escapedName};{escapedDescription};{escapedRoomNr};{escapedStopManager};{escapedStudentsRequested};{escapedStudentsAssigned};{escapedStopGroupNames};{escapedDivisions}");
        }

        var csvBytes = Utils.ToUtf8Bom(csvBuilder.ToString());

        return Results.File(
            fileContents: csvBytes,
            contentType: "text/csv",
            fileDownloadName: "stops-export.csv"
        );
    }

    public static async Task<IResult> GetStopCsv(TadeoTDbContext context, [FromRoute] int stopId)
    {
        var students = await context.Students
            .Include(s => s.StudentAssignments)
            .ThenInclude(studentAssignment => studentAssignment.Stop)
            .Where(s => s.StudentAssignments.Any(sa =>
                sa.StopId == stopId && (sa.Status == Status.ACCEPTED || sa.Status == Status.PENDING)))
            .OrderBy(s => s.Department)
            .ThenBy(s => s.StudentClass)
            .ThenBy(s => s.EdufsUsername)
            .ThenBy(s => s.LastName)
            .ThenBy(s => s.FirstName)
            .ToListAsync();

        if (students.Count == 0)
        {
            return Results.NotFound($"No students found for stop with ID {stopId}");
        }

        var csvBuilder = new StringBuilder();
        csvBuilder.AppendLine("Abteilung;Klasse;EdufsUsername;Nachname;Vorname;Status");
        foreach (var student in students)
        {
            var escapedDepartment = Utils.EscapeCsvField(student.Department);
            var escapedClass = Utils.EscapeCsvField(student.StudentClass);
            var escapedEdufsUsername = Utils.EscapeCsvField(student.EdufsUsername);
            var escapedLastname = Utils.EscapeCsvField(student.LastName);
            var escapedFirstname = Utils.EscapeCsvField(student.FirstName);
            var escapedStatus = Utils.EscapeCsvField(student.StudentAssignments
                .First(sa => sa.StopId == stopId && sa.Status is Status.ACCEPTED or Status.PENDING)
                .Status
                .ToString());
            csvBuilder.AppendLine($"{escapedDepartment};{escapedClass};{escapedEdufsUsername};{escapedLastname};{escapedFirstname};{escapedStatus}");
        }

        var csvBytes = Utils.ToUtf8Bom(csvBuilder.ToString());

        return Results.File(
            fileContents: csvBytes,
            contentType: "text/csv",
            fileDownloadName: "stop-export.csv"
        );
    }

    public record UpdateStopRequestDto(
        int Id,
        [Required, MaxLength(100)] string Name,
        [Required, MaxLength(500)] string Description,
        [Required, MaxLength(50)] string RoomNr,
        int[] DivisionIds,
        StudentOfStopDto[] StudentAssignments,
        string[] StopManagerAssignments
    );

    public record UpdateStopAsStopManagerRequestDto(
        int Id,
        [Required, MaxLength(100)] string Name,
        [Required, MaxLength(500)] string Description,
        [Required, MaxLength(50)] string RoomNr,
        StudentOfStopDto[] StudentAssignments
    );

    public record CreateStopRequestDto(
        [Required, MaxLength(100)] string Name,
        [Required, MaxLength(500)] string Description,
        [Required, MaxLength(50)] string RoomNr,
        int[] DivisionIds,
        int[] StopGroupIds,
        StudentOfStopDto[] StudentAssignments,
        string[] StopManagerAssignments
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
        string RoomNr,
        List<OtherStudentOfStopDto> OtherStudents
    );

    public record OtherStudentOfStopDto(
        string LastName,
        string FirstName,
        string StudentClass,
        string Department
    );
}