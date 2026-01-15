using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

[Index(nameof(Name), IsUnique = true)]
public class StopGroup
{
    [Key]
    public int Id { get; set; }
    [Range(0, int.MaxValue)]
    public int Order { get; set; } // defaults to 0 in database
    [Required, MaxLength(300)]
    public required string Name { get; set; }
    [Required, MaxLength(3000)]
    public required string Description { get; set; }
    [Required]
    public required bool IsPublic { get; set; }

    public List<StopGroupAssignment> StopAssignments { get; set; } = [];
}
