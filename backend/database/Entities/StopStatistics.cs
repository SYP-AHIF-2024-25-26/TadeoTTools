using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

public class StopStatistic
{
    [Key]
    public int Id { get; set; }
    public required DateTime Time { get; set; }
    public required bool IsDone { get; set; }

    public int StopId { get; set; }
    public Stop? Stop { get; set; }
}
