using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Database.Entities;

public abstract class FeedbackQuestion
{
    [Key]
    public int Id { get; set; }
    [Required, MaxLength(255)]
    public required string Question { get; set; }
    [Range(0, int.MaxValue)]
    public int Order { get; set; }
    public bool Required { get; set; }

    public List<FeedbackDependency> Dependencies { get; set; } = [];

    public List<FeedbackQuestionAnswer> FeedbackQuestionAnswers { get; set; } = [];
}

public class FeedbackTextQuestion : FeedbackQuestion
{
    [MaxLength(100)]
    public string? Placeholder { get; set; }
}

public class FeedbackRatingQuestion : FeedbackQuestion
{
    [Range(1, 9)]
    public int MinRating { get; set; }
    [Range(2, 10)]
    public int MaxRating { get; set; }

    [MaxLength(100)]
    public string? RatingLabels { get; set; }
}

public class FeedbackChoiceQuestion : FeedbackQuestion
{
    public bool AllowMultiple { get; set; }
    public List<FeedbackOption> Options { get; set; } = [];
}