using System.ComponentModel.DataAnnotations;

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
    [MaxLength(50)]
    public required string StudentId { get; set; }
    public Student? Student { get; set; }
    public int StopId { get; set; }
    public Stop? Stop { get; set; }
    public Status Status { get; set; }
}
