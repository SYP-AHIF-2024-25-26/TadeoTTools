using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Database.Entities;

/// <summary>A counter where the cashier kiosk sells. Hidden from the kiosk while its menu is empty.</summary>
[Index(nameof(Location), IsUnique = true)]
public class Buffet
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(3)]
    public required string Location { get; set; }

    [MaxLength(100)]
    public string Description { get; set; } = "";

    public List<BuffetProduct> Menu { get; set; } = [];
    public List<CashMovement> CashMovements { get; set; } = [];
    public List<Order> Orders { get; set; } = [];
}
