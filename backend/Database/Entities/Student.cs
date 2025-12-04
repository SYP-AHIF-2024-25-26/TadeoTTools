using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

public class Student
{
    [Key]
    [MaxLength(100)]
    public required string EdufsUsername { get; set; }
    [MaxLength(150)]
    public string FirstName { get; set; } = string.Empty;
    [MaxLength(150)]
    public string LastName { get; set; } = string.Empty;
    [MaxLength(20)]
    public string StudentClass { get; set; } = string.Empty;
    [MaxLength(100)]
    public string Department { get; set; } = string.Empty;
    public List<StudentAssignment> StudentAssignments { get; set; } = [];
}