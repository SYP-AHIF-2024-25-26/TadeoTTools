namespace Database.Entities;

public class FeedbackOption
{
    public int Id { get; set; }
    public string Value { get; set; }
    
    public int FeedbackQuestionId { get; set; }
    public FeedbackQuestion FeedbackQuestion { get; set; }
}
