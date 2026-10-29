using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Database.Entities;

/// <summary>Something sold at the buffet. One price at every buffet; a negative price is a voucher.</summary>
[Index(nameof(Name), IsUnique = true)]
public class Product
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(40)]
    public required string Name { get; set; }

    /// <summary>Shown under the name at the kiosk ("Stück", "Becher"); may be empty.</summary>
    [MaxLength(20)]
    public string Unit { get; set; } = "";

    public int PriceCents { get; set; }

    public List<BuffetProduct> BuffetProducts { get; set; } = [];
    public List<OrderItem> OrderItems { get; set; } = [];
}
