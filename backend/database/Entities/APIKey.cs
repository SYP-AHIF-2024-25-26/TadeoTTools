using System.ComponentModel.DataAnnotations;

namespace Database.Entities;
public class APIKey
{
    [Key]
    public required string APIKeyValue { get; set; }
}
