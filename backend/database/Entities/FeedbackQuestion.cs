using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

public class FeedbackQuestion
{
    [Key]
    public int Id { get; set; }
    public required string Question { get; set; }
    public List<string>? Answers { get; set; } = new();
}