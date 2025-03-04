﻿using Database;
using Database.Entities;
using Database.Repository;
using Database.Repository.Functions;

namespace ImportConsoleApp;

public class Program
{
    private static async Task InitDb(string? path)
    {
        Console.WriteLine("Recreate database ...");
        using var context = TadeoTDbContextFactory.CreateDbContext();

        await context.Database.EnsureDeletedAsync();
        await context.Database.EnsureCreatedAsync();

        Console.WriteLine("Importing data ...");

        await CsvImporter.ImportCsvFileAsync(path ?? "TdoT_Stationsplanung_2025.csv", context);

        Console.WriteLine("Imported " + context.Stops.Count() + " stops");
        Console.WriteLine("Imported " + context.StopGroups.Count() + " stop groups");
        Console.WriteLine("Imported " + context.Divisions.Count() + " divisions");
        Console.WriteLine("Imported " + context.StopGroupAssignments.Count() + " stop group assignments");
    }

    public static async Task Main(string?[] args)
    {
        if (args.Length > 0)
        {
            var currentPath = Directory.GetCurrentDirectory();
            var parentPath = Directory.GetParent(currentPath)?.FullName;
            if (parentPath != null)
            {
                var importCsvPath = Path.Combine(parentPath, "ImportConsoleApp");
                var csvFilePath = Path.Combine(importCsvPath, "TdoT_Stationsplanung_2025.csv");
                await InitDb(csvFilePath);
            }
        } else
        {
            await InitDb(null);
        }
    }
}

