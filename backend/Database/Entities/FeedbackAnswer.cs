using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

public class FeedbackQuestionAnswer
{
    [Key]
    public int Id { get; set; }
    public string Answer { get; set; }
    
    public int FeedbackQuestionId { get; set; }
    public FeedbackQuestion? FeedbackQuestion { get; set; }
    
    public int FeedbackSessionId { get; set; }
    public FeedbackSession? FeedbackSession { get; set; }
}