using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

/// <summary>A product line of a sale, with the price it was sold at.</summary>
public class OrderItem
{
    [Key]
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order? Order { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    /// <summary>The product's price when the sale was stored, so later price changes keep the revenue.</summary>
    public int UnitPriceCents { get; set; }
}
