using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using static Database.Types;

namespace Database.Entities;

[Index(nameof(Id), IsUnique = true)]
internal class User
{
    [Key]
    public int Id { get; set; }
    public Role Role { get; set; }
}
