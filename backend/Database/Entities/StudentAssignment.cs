using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Database.Entities;

public enum Status
{
    PENDING,
    ACCEPTED,
    DECLINED
}

public class StudentAssignment
{
    [Key]
    public int Id { get; set; }
    [MaxLength(100)]
    [ForeignKey(nameof(Student))]
    public required string EdufsUsername { get; set; }
    public Student? Student { get; set; }
    public int StopId { get; set; }
    public Stop? Stop { get; set; }
    public Status Status { get; set; }
}
