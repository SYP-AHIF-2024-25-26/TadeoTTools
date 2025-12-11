using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

public class Teacher
{
    [Key]
    [MaxLength(100)]
    public required string EdufsUsername { get; set; }
    [MaxLength(150)]
    public string FirstName { get; set; } = string.Empty;
    [MaxLength(150)]
    public string LastName { get; set; } = string.Empty;
    public List<TeacherAssignment> AssignedStops { get; set; } = [];
}