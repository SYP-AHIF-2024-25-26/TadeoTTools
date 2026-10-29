using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

/// <summary>Cash put into (positive) or taken out of (negative) a buffet's till.</summary>
public class CashMovement
{
    [Key]
    public int Id { get; set; }

    public int BuffetId { get; set; }
    public Buffet? Buffet { get; set; }

    /// <summary>UTC.</summary>
    public DateTime Time { get; set; }

    public int AmountCents { get; set; }
}
