using Database.Repository.Functions;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

[Index(nameof(Name), IsUnique = true)]
public class Stop
{
    [Key]
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required string RoomNr { get; set; }

    public List<StopStatistic> Statistics { get; set; } = [];
    public List<Division> Divisions { get; set; } = [];
    public List<StopGroupAssignment> StopGroupAssignments { get; set; } = [];
    public List<StudentAssignment> StudentAssignments { get; set; } = [];
    public List<TeacherAssignment> TeacherAssignments { get; set; } = [];
}
