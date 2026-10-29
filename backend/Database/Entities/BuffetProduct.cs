using Microsoft.EntityFrameworkCore;

namespace Database.Entities;

/// <summary>A product on a buffet's menu; <see cref="Order"/> is its place at the counter.</summary>
[PrimaryKey(nameof(BuffetId), nameof(ProductId))]
public class BuffetProduct
{
    public int BuffetId { get; set; }
    public Buffet? Buffet { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public int Order { get; set; }
}
