using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

public class TeacherAssignments
{
    [Key]
    public int Id { get; set; }
    public int StopId { get; set; }
    public Stop? Stop { get; set; }
    public string EdufsUsername { get; set; }
    public Teacher? Teacher { get; set; }
}