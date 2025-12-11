using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

/// <summary>
/// Represents a dependency between two feedback questions.
/// If ConditionValue matches the answer of DependsOnQuestion, Question will be shown.
/// </summary>
public class FeedbackDependency
{
    public int Id { get; set; }

    public int QuestionId { get; set; }
    public required FeedbackQuestion Question { get; set; }

    public int DependsOnQuestionId { get; set; }
    public required FeedbackQuestion DependsOnQuestion { get; set; }

    [MaxLength(255)]
    public required string ConditionValue { get; set; }
}
