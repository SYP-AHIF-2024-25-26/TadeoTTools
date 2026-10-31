using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Database.Entities;

/// <summary>A room or named spot on a floor plan; the stops in it share one marker in the GuideApp.</summary>
[Index(nameof(Code), IsUnique = true)]
public class MapPlace
{
    [Key]
    public int Id { get; set; }
    /// <summary>The plan it is on: "U", "E" or "1".</summary>
    [MaxLength(1)]
    public required string Floor { get; set; }
    /// <summary>Internal: the room number on the plan ("E58-1") or the name of a spot ("Pausenbereich UG").</summary>
    [MaxLength(50)]
    public required string Code { get; set; }
    /// <summary>What visitors read for this place; without it they read the stop's room text.</summary>
    [MaxLength(50)]
    public string? Name { get; set; }
    /// <summary>Position as a fraction (0 to 1) of the plan image.</summary>
    public double X { get; set; }
    public double Y { get; set; }
    /// <summary>Shown on the visitor map without a stop, e.g. the Buffet.</summary>
    [MaxLength(50)]
    public string? PublicLabel { get; set; }
    /// <summary>Icon of the public label, see MapFunctions.Icons.</summary>
    [MaxLength(20)]
    public string? Icon { get; set; }

    public List<Stop> Stops { get; set; } = [];
}
