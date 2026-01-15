using Database.Entities;
using Database.Repository;
using Microsoft.EntityFrameworkCore;

namespace Database;

public class CsvImporter
{
    public static List<Division> StaticDivisions { get; set; } =
    [
        new Division { Name = "HIF", Color = "#004f9f" },
        new Division { Name = "HITM", Color = "#6cb6dd" },
        new Division { Name = "HEL", Color = "#be1522" },
        new Division { Name = "HBG", Color = "#f18800" },
        new Division { Name = "ALL", Color = "#7ebf74" },
    ];

    public static async Task ImportCsvFileAsync(string path, TadeoTDbContext context)
    {
        var lines = await File.ReadAllLinesAsync(path);

        // Fetch all stop managers into memory for matching
        var allStopManagers = await context.StopManagers.ToListAsync();

        var allRecords = lines.Skip(1).Select(l => l.Split(';'))
            .Select(columns => new
            {
                Divisions = columns[0].Contains(',') ? columns[0].Split(",") : [columns[0]],
                Level = columns[1],
                Name = columns[2],
                Responsible = columns[3], // "Verantwortlich" column
                Location = columns[4],
                StopGroupRank = columns[5],
                StopRanks = columns[6].Split(',').Select(c => c.Trim()).Where(s => !string.IsNullOrEmpty(s)).ToList(),
                Description = columns[7]
            }).ToList();
        var records = allRecords.Where(r => !string.IsNullOrEmpty(r.Name))
            .Where(r => !string.IsNullOrEmpty(r.StopGroupRank) || !string.IsNullOrEmpty(r.StopRanks.FirstOrDefault()))
            .ToList();
        var stopGroups = records
            .Where(r => !string.IsNullOrEmpty(r.StopGroupRank))
            .Select(r => new StopGroup
            {
                Name = r.Name,
                Description = r.Description,
                Order = int.Parse(r.StopGroupRank),
                IsPublic = true
            }).ToList();

        var stops = records
            .Where(r => r.StopRanks.Any())
            .Select(r =>
            {
                var stop = new Stop
                {
                    Name = r.Name,
                    Description = r.Description,
                    RoomNr = r.Location,
                    StopGroupAssignments = r.StopRanks
                        .Select(rank => int.Parse(rank))
                        .Select(rank => new StopGroupAssignment
                        {
                            StopGroup = stopGroups.Single(sg => sg.Order == rank),
                        }).ToList(),
                    Divisions = r.Divisions
                        .SelectMany(d => StaticDivisions.Where(sd => sd.Name == d))
                        .ToList()
                };

                // StopManager Assignment Logic
                if (!string.IsNullOrWhiteSpace(r.Responsible))
                {
                    // Split multiple names if present (e.g. "Name1/Name2" or "Name1, Name2")
                    var names = r.Responsible.Split(['/', ','], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

                    foreach (var namePart in names)
                    {
                        StopManager? match = null;

                        // Try matching by Full Name match (FirstName + LastName)
                        match = allStopManagers.FirstOrDefault(t =>
                            (t.FirstName + " " + t.LastName).Contains(namePart, StringComparison.OrdinalIgnoreCase) ||
                            (t.LastName + " " + t.FirstName).Contains(namePart, StringComparison.OrdinalIgnoreCase));

                        // Try matching by Last Name only
                        if (match == null)
                        {
                            match = allStopManagers.FirstOrDefault(t =>
                                t.LastName.Equals(namePart, StringComparison.OrdinalIgnoreCase) ||
                                t.LastName.Contains(namePart, StringComparison.OrdinalIgnoreCase));
                        }

                        if (match != null)
                        {
                            stop.StopManagerAssignments.Add(new StopManagerAssignment
                            {
                                StopManagerId = match.EdufsUsername,
                                Stop = stop
                            });
                        }
                    }
                }

                stop.StopGroupAssignments.ForEach(sga =>
                {
                    sga.Stop = stop;
                    sga.StopGroup!.StopAssignments.Add(sga);
                });
                return stop;
            }).ToList();
        stopGroups.ForEach(sg =>
        {
            sg.StopAssignments = stops
                .SelectMany(s => s.StopGroupAssignments.Where(sga => sga.StopGroup == sg))
                .ToList();
            int rank = 1;
            sg.StopAssignments.ForEach(sa => { sa.Order = rank++; });
        });
        await context.StopGroups.AddRangeAsync(stopGroups);
        await context.Stops.AddRangeAsync(stops);
        await context.SaveChangesAsync();
    }

    public static async Task ImportStudentsAsync(string path, TadeoTDbContext context)
    {
        var lines = await File.ReadAllLinesAsync(path);
        var students = lines
            .Skip(1)
            .Select(line => line.Split(';'))
            .Select(cols => new Student
            {
                EdufsUsername = cols[0],
                FirstName = cols[1],
                LastName = cols[2],
                StudentClass = cols[3],
                Department = cols[4],
            });

        await context.Students.AddRangeAsync(students);
        await context.SaveChangesAsync();
    }

    public static async Task ImportStopManagersAsync(string path, TadeoTDbContext context)
    {
        var lines = await File.ReadAllLinesAsync(path);

        var stopManagers = lines
            .Skip(1)
            .Select(line => line.Split(';'))
            .Select(cols => new StopManager
            {
                EdufsUsername = cols[0],
                FirstName = cols[1],
                LastName = cols[2],
            });

        await context.StopManagers.AddRangeAsync(stopManagers);
        await context.SaveChangesAsync();
    }
}