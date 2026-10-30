using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Database.Entities;

/// <summary>An Austrian political district (Bezirk); Vienna's districts are 901–923.</summary>
[Index(nameof(Number), IsUnique = true)]
[Index(nameof(Name), IsUnique = true)]
public class District
{
    [Key]
    public int Id { get; set; }

    /// <summary>The three-digit district number of Statistik Austria (first digits of a Gemeindekennziffer).</summary>
    [Range(100, 999)]
    public int Number { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    public List<City> Cities { get; set; } = [];
}
