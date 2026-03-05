using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Database.Entities;

[Index(nameof(FeatureKey), IsUnique = true)]
public class FeatureFlag
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string FeatureKey { get; set; } = string.Empty;

    public bool IsEnabled { get; set; } = false;

    public string? Description { get; set; }
}
