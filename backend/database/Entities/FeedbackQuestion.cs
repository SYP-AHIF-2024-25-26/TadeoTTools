using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

public class FeedbackQuestion
{
    [Key]
    public int Id { get; set; }
    public string Question { get; set; }
    public string Type { get; set; }
    public bool Required { get; set; }
    public string? Placeholder { get; set; }
    public List<string>? Options { get; set; }
    public int? MinRating { get; set; }
    public int? MaxRating { get; set; }
    public string? RatingLabels { get; set; }
    public int Order { get; set; }
    public List<FeedbackQuestionAnswer> FeedbackQuestionAnswers = [];
}