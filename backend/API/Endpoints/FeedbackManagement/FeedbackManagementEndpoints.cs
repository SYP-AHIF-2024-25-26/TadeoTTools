using Database.Entities;
using Database.Repository;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.FeedbackManagement;

public static class FeedbackManagementEndpoints
{
    public static async Task<IResult> GetFeedbacks(TadeoTDbContext context)
    {
        var feedbacks = await context.FeedbackQuestions
            .ToListAsync();
        return Results.Ok(feedbacks);
    }

    public static async Task<IResult> CreateFeedback(CreateFeedbackRequestDto[] feedbackRequestDtos, TadeoTDbContext context)
    {
        if (feedbackRequestDtos.Length == 0)
        {
            return Results.BadRequest("No feedback provided");
        }

        foreach (var feedbackRequestDto in feedbackRequestDtos)
        {
            var question = await context.FeedbackQuestions
                .FindAsync(feedbackRequestDto.QuestionId);
        
            if (question == null)
            {
                return Results.NotFound();
            }
            question.Answers ??= [];
            question.Answers.Add(feedbackRequestDto.Answer);
        }
        await context.SaveChangesAsync();
        
        return Results.Ok();
    }
    
    public static async Task<IResult> CreateFeedbackQuestion(CreateFeedbackQuestionDto dto, TadeoTDbContext context)
    {
        var question = new FeedbackQuestion
        {
            Question = dto.Question,
        };
        
        context.FeedbackQuestions.Add(question);
        await context.SaveChangesAsync();
        
        return Results.Ok();
    }

    public static async Task<IResult> DeleteFeedbackQuestion([FromRoute] int id, TadeoTDbContext context)
    {
        var feedbackQuestion = await context.FeedbackQuestions.FindAsync(id);
        if (feedbackQuestion == null)
        {
            return Results.NotFound();
        }
        
        context.FeedbackQuestions.Remove(feedbackQuestion);
        await context.SaveChangesAsync();
        
        return Results.Ok();
    }
}

public record CreateFeedbackQuestionDto(string Question);

public record GetFeedbackQuestionDto(int Id, string Question);

public record CreateFeedbackRequestDto(
    int QuestionId,
    string Answer
);