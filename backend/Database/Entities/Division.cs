using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Database.Entities;

[Index(nameof(Name), IsUnique = true)]
public class Division
{
    [Key]
    public int Id { get; set; }
    [MaxLength(100)]
    public required string Name { get; set; }
    [MaxLength(7)]
    public required string Color { get; set; }

    public byte[]? Image { get; set; }

    public List<Stop> Stops { get; set; } = [];
}
