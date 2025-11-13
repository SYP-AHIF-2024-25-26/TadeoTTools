using System.Text;
using Database.Entities;
using Database.Repository;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.FeedbackManagement;

public static class FeedbackManagementEndpoints
{
    public static async Task<IResult> GetFeedbackQuestions(TadeoTDbContext context)
    {
        var questions = await context.FeedbackQuestions
            .Select(f => new GetFeedbackQuestionDto(
                f.Id, f.Question, f.Type.ToString(), f.Required, f.Placeholder,
                f.Options != null ? f.Options.OrderBy(o => o.Id).Select(o => o.Value).ToArray() : null, f.MinRating, f.MaxRating,
                f.RatingLabels, f.Order))
            .ToListAsync();

        var sortedQuestions = questions.OrderBy(q => q.Order).ToList();

        return Results.Ok(sortedQuestions);
    }
    
    public static async Task<IResult> CreateFeedback(CreateFeedbackRequestDto[] feedbackRequestDtos,
        TadeoTDbContext context)
    {
        if (feedbackRequestDtos.Length == 0)
        {
            return Results.BadRequest("No feedback provided");
        }

        // Validate all questions exist before creating session
        foreach (var feedbackRequestDto in feedbackRequestDtos)
        {
            if (await context.FeedbackQuestions
                    .FindAsync(feedbackRequestDto.QuestionId) == null)
            {
                return Results.BadRequest($"Question with id {feedbackRequestDto.QuestionId} was not found");
            }
        }

        // Create a new feedback session with timestamp
        var feedbackSession = new FeedbackSession
        {
            Timestamp = DateTime.UtcNow
        };
        await context.FeedbackSessions.AddAsync(feedbackSession);
        await context.SaveChangesAsync(); // Save to get the session ID

        // Create all answers associated with this session
        foreach (var feedbackRequestDto in feedbackRequestDtos)
        {
            await context.FeedbackQuestionAnswers.AddAsync(new FeedbackQuestionAnswer
            {
                Answer = feedbackRequestDto.Answer,
                FeedbackQuestionId = feedbackRequestDto.QuestionId,
                FeedbackSessionId = feedbackSession.Id
            });
        }

        await context.SaveChangesAsync();

        return Results.Ok(new { SessionId = feedbackSession.Id, Timestamp = feedbackSession.Timestamp });
    }

    public static async Task<IResult> SaveFeedbackQuestions(UpsertFeedbackQuestionDto[] dtos, TadeoTDbContext context)
    {
        var incomingIds = dtos.Where(dto => dto.Id.HasValue).Select(dto => dto.Id!.Value).ToList();

        var questionsToDelete = await context.FeedbackQuestions
            .Where(q => !incomingIds.Contains(q.Id))
            .ToListAsync();

        context.FeedbackQuestions.RemoveRange(questionsToDelete);

        foreach (var dto in dtos)
        {
            if (dto.Id.HasValue)
            {
                await UpdateFeedbackQuestion(dto, context);
            }
            else
            {
                await AddFeedbackQuestion(dto, context);
            }
        }

        await context.SaveChangesAsync();
        return Results.Ok();
    }

    public static async Task<IResult> GetFeedbackAnswersCsv(TadeoTDbContext context)
    {
        var feedbackAnswers = await context.FeedbackQuestionAnswers
            .Include(f => f.FeedbackQuestion)
            .Include(f => f.FeedbackSession)
            .OrderBy(f => f.FeedbackSessionId)
            .ThenBy(f => f.FeedbackQuestionId)
            .Select(f => new
            {
                SessionId = f.FeedbackSessionId,
                Timestamp = f.FeedbackSession!.Timestamp,
                f.FeedbackQuestion!.Question,
                f.Answer
            })
            .ToListAsync();

        // Create CSV content
        var csvBuilder = new StringBuilder();

        // Add headers
        csvBuilder.AppendLine("SessionId;Timestamp;Question;Answer");

        // Add data rows
        foreach (var item in feedbackAnswers)
        {
            var escapedQuestion = Utils.EscapeCsvField(item.Question);
            var escapedAnswer = Utils.EscapeCsvField(item.Answer);

            csvBuilder.AppendLine($"{item.SessionId};{item.Timestamp:yyyy-MM-dd HH:mm:ss};{escapedQuestion};{escapedAnswer}");
        }

        var csvBytes = Utils.ToUtf8Bom(csvBuilder.ToString());

        return Results.File(
            fileContents: csvBytes,
            contentType: "text/csv",
            fileDownloadName: "feedback_answers.csv"
        );
    }

    private static async Task UpdateFeedbackQuestion(UpsertFeedbackQuestionDto dto, TadeoTDbContext context)
    {
        var existingQuestion = await context.FeedbackQuestions
            .Include(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == dto.Id!.Value);
        
        if (existingQuestion != null)
        {
            existingQuestion.Question = dto.Question;
            existingQuestion.Type = dto.Type.ToLower();
            existingQuestion.Required = dto.Required;
            existingQuestion.Placeholder = dto.Placeholder;
            
            // Clear existing options to prevent duplicates
            existingQuestion.Options?.Clear();
            
            // Add new options
            if (dto.Options != null)
            {
                existingQuestion.Options = dto.Options.Select(o => new FeedbackOption
                {
                    Value = o
                }).ToList();
            }
            
            existingQuestion.MinRating = dto.MinRating;
            existingQuestion.MaxRating = dto.MaxRating;
            existingQuestion.RatingLabels = dto.RatingLabels;
            existingQuestion.Order = dto.Order;
        }
    }

    private static async Task AddFeedbackQuestion(UpsertFeedbackQuestionDto dto, TadeoTDbContext context)
    {
        var newQuestion = new FeedbackQuestion
        {
            Question = dto.Question,
            Type = dto.Type.ToLower(),
            Required = dto.Required,
            Placeholder = dto.Placeholder,
            Options = dto.Options?.Select(o => new FeedbackOption
            {
                Value = o
            }).ToList(),
            MinRating = dto.MinRating,
            MaxRating = dto.MaxRating,
            RatingLabels = dto.RatingLabels,
            Order = dto.Order
        };
        await context.FeedbackQuestions.AddAsync(newQuestion);
    }
}

public record UpsertFeedbackQuestionDto(
    int? Id,
    string Question,
    string Type,
    bool Required,
    string? Placeholder,
    string[]? Options,
    int? MinRating,
    int? MaxRating,
    string? RatingLabels,
    int Order
);

public record GetFeedbackQuestionDto(
    int Id,
    string Question,
    string Type,
    bool Required,
    string? Placeholder,
    string[]? Options,
    int? MinRating,
    int? MaxRating,
    string? RatingLabels,
    int Order);

public record CreateFeedbackRequestDto(
    int QuestionId,
    string Answer
);

public record GetFeedbackAnswerDto(string Answer);