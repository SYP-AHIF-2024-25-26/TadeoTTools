using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

public class StopManagerAssignment
{
    [Key]
    public int Id { get; set; }
    [MaxLength(100)]
    public required string StopManagerId { get; set; }
    public StopManager? StopManager { get; set; }
    public int StopId { get; set; }
    public Stop? Stop { get; set; }
}
