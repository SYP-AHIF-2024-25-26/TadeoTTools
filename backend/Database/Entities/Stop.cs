using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

[Index(nameof(Name), IsUnique = true)]
public class Stop
{
    [Key]
    public int Id { get; set; }
    [MaxLength(100)]
    public required string Name { get; set; }
    [MaxLength(500)]
    public required string Description { get; set; }
    [MaxLength(50)]
    public required string RoomNr { get; set; }

    public List<Division> Divisions { get; set; } = [];
    public List<StopGroupAssignment> StopGroupAssignments { get; set; } = [];
    public List<StudentAssignment> StudentAssignments { get; set; } = [];
    public List<StopManagerAssignment> StopManagerAssignments { get; set; } = [];
}
