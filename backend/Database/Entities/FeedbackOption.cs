using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

public class FeedbackOption
{
    public int Id { get; set; }
    [MaxLength(255)]
    public required string Value { get; set; }

    public int FeedbackQuestionId { get; set; }
    public required FeedbackChoiceQuestion FeedbackQuestion { get; set; }
}
