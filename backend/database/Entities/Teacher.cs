using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

public class Teacher
{
    [Key]
    public required string EdufsUsername { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public List<Stop> AssignedStops { get; set; } = [];
}