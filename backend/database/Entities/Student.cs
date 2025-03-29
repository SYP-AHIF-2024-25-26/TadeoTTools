using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

public class Student
{
    [Key]
    public required string EdufsUsername { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string StudentClass { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public List<StudentAssignment> StudentAssignments { get; set; } = [];
}