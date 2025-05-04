using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

public class StopGroupAssignment
{
    [Key]
    public int Id { get; set; }
    public int StopId { get; set; }
    public Stop? Stop { get; set; }
    public int StopGroupId { get; set; }
    public StopGroup? StopGroup { get; set; }
    public int Order { get; set; }
}
