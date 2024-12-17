﻿using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Core.Entities;

[Index(nameof(Name), IsUnique = true)]
public class Stop
{
    [Key]
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required string RoomNr { get; set; }

    public List<StopStatistic> Statistics { get; set; } = new();
    public List<Division> Divisions { get; set; } = new();
    public List<StopGroupAssignment> StopGroupAssignments { get; set; } = new();
}
