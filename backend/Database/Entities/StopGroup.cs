using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

[Index(nameof(Name), IsUnique = true)]
public class StopGroup
{
    [Key]
    public int Id { get; set; }
    public int Rank { get; set; } // defaults to 0 in database
    [MaxLength(300)]
    public required string Name { get; set; }
    [MaxLength(3000)]
    public required string Description { get; set; }
    public required bool IsPublic { get; set; }

    public List<StopGroupAssignment> StopAssignments { get; set; } = [];
}
