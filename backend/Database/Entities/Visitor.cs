using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Database.Entities;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum Gender
{
    Male,
    Female,
    NotStated,
}

/// <summary>A visitor registered at the entrance kiosk. The photo, if any, is a file named by the id.</summary>
public class Visitor
{
    [Key]
    public int Id { get; set; }

    /// <summary>UTC time the visitor was saved.</summary>
    public DateTime CreatedAt { get; set; }

    public Gender Gender { get; set; }

    /// <summary>Adults who came with the visitor.</summary>
    [Range(0, 4)]
    public int Adults { get; set; }

    [Range(7, 13)]
    public int SchoolLevel { get; set; }

    public int CityId { get; set; }
    public City? City { get; set; }

    /// <summary>The text of the chosen <see cref="RegistrationOptionKind.ReasonForVisit"/> option.</summary>
    [MaxLength(100)]
    public string ReasonForVisit { get; set; } = "";

    /// <summary>The text of the chosen <see cref="RegistrationOptionKind.SchoolType"/> option.</summary>
    [MaxLength(100)]
    public string SchoolType { get; set; } = "";

    public bool InterestedInInformatik { get; set; }
    public bool InterestedInMedientechnik { get; set; }
    public bool InterestedInElektronik { get; set; }
    public bool InterestedInMedizintechnik { get; set; }
    public bool InterestedInFachschuleInformatik { get; set; }
    public bool InterestedInFachschuleElektronik { get; set; }
    public bool InterestedInAbendschule { get; set; }
    public bool InterestedInKolleg { get; set; }

    [MaxLength(100)]
    public string Comment { get; set; } = "";

    /// <summary>A photo for the Roboterführerschein was taken and stored as <c>Visitor_{Id:D4}.png</c>.</summary>
    public bool HasPhoto { get; set; }

    /// <summary>preferred_username of the person logged in at the kiosk who saved the registration.</summary>
    [MaxLength(100)]
    public string RegisteredBy { get; set; } = "";
}
