using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Database.Entities;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RegistrationOptionKind
{
    ReasonForVisit,
    SchoolType,
}

/// <summary>
/// An entry of one of the two choice lists at the registration kiosk, in <see cref="Order"/>.
/// A visitor stores the chosen text, so changing the list leaves past registrations unchanged.
/// </summary>
[Index(nameof(Kind), nameof(Name), IsUnique = true)]
public class RegistrationOption
{
    [Key]
    public int Id { get; set; }

    public RegistrationOptionKind Kind { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    public int Order { get; set; }
}
