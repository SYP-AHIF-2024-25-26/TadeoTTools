using Database.Entities;
using Database.Repository;

namespace Database;

public class CsvImporter
{

    public static async Task ImportCsvFileAsync(string path, TadeoTDbContext context)
    {
        var lines = await File.ReadAllLinesAsync(path);
        var allRecords = lines.Skip(1).Select(l => l.Split(';'))
            .Select(columns => new
            {
                Division = columns[0],
                Level = columns[2],
                Name = columns[3],
                Location = columns[5],
                StopGroupRank = columns[6],
                StopRanks = columns[7].Split(',').Select(c => c.Trim()).Where(s => !string.IsNullOrEmpty(s)).ToList(),
                Description = columns[8],
                Club = columns[9]
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
                Rank = int.Parse(r.StopGroupRank),
                IsPublic = true
            }).ToList();
        var divisions = records
            .Select(r => r.Division)
            .Distinct()
            .Where(name => !string.IsNullOrEmpty(name))
            .SelectMany(name => name.Split(','))
            .Distinct()
            .Select(r => new Division
            {
                Name = r,
                Color = "#" + Guid.NewGuid().ToString().Substring(0, 6)
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
                            StopGroup = stopGroups.Single(sg => sg.Rank == rank),
                        }).ToList(),
                    Divisions = divisions.Where(d => r.Division == d.Name).ToList()
                };
                stop.StopGroupAssignments.ForEach(sga => sga.Stop = stop);
                return stop;
            }).ToList();
        stopGroups.ForEach(sg =>
        {
            sg.StopAssignments = stops
                .SelectMany(s => s.StopGroupAssignments.Where(sga => sga.StopGroup == sg))
                .ToList();
            int rank = 1;
            sg.StopAssignments.ForEach(sa =>
            {
                sa.Order = rank++;
            });
        });
        await context.Divisions.AddRangeAsync(divisions);
        await context.StopGroups.AddRangeAsync(stopGroups);
        await context.Stops.AddRangeAsync(stops);
        await context.SaveChangesAsync();
    }
}
