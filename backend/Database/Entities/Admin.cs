using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

[Index(nameof(Id), IsUnique = true)]
public class Admin
{
    [Key]
    [MaxLength(50)]
    public required string Id { get; set; }
}
