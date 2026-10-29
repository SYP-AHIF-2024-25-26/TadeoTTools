using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Database.Entities;

/// <summary>One sale at the cashier kiosk.</summary>
[Index(nameof(OrderNumber), IsUnique = true)]
public class Order
{
    [Key]
    public int Id { get; set; }

    /// <summary>Set by the kiosk (device id + sequence); a sale sent twice is stored once.</summary>
    [Required]
    [MaxLength(50)]
    public required string OrderNumber { get; set; }

    /// <summary>UTC time the sale was completed at the kiosk, not when it arrived.</summary>
    public DateTime CreatedAt { get; set; }

    public int BuffetId { get; set; }
    public Buffet? Buffet { get; set; }

    /// <summary>preferred_username of the person logged in at the kiosk when the sale was sent.</summary>
    [MaxLength(100)]
    public string CashierUsername { get; set; } = "";

    public List<OrderItem> Items { get; set; } = [];
}
