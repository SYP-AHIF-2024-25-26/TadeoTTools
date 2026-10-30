using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Database.Entities;

/// <summary>
/// A town visitors can come from, chosen by postcode at the registration kiosk. Several towns can
/// share a postcode, and in Vienna several postcodes share one <see cref="Number"/>.
/// The ids of the legacy backend are kept, so a kiosk switched back to it still sends valid ids.
/// </summary>
[Index(nameof(ZipCode), nameof(Name), IsUnique = true)]
public class City
{
    [Key]
    public int Id { get; set; }

    [Required]
    [RegularExpression("^[1-9][0-9]{3}$", ErrorMessage = "The postcode must have four digits.")]
    [MaxLength(4)]
    public required string ZipCode { get; set; }

    [Required]
    [MaxLength(300)]
    public required string Name { get; set; }

    /// <summary>The Gemeindekennziffer of Statistik Austria; not unique.</summary>
    [Range(10000, 99999)]
    public int Number { get; set; }

    public int DistrictId { get; set; }
    public District? District { get; set; }

    public List<Visitor> Visitors { get; set; } = [];
}
