using System.Text;
using Database.Entities;
using Database.Repository;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace API.Endpoints.FeedbackManagement;

public static class FeedbackManagementEndpoints
{
    public static async Task<IResult> GetFeedbackQuestions(TadeoTDbContext context)
    {
        var questions = await context.FeedbackQuestions
            .Include(q => q.Dependencies)
            .Include(q => ((FeedbackChoiceQuestion)q).Options)
            .OrderBy(q => q.Order)
            .ToListAsync();

        var dtos = questions.Select(q =>
        {
            FeedbackQuestionType type = q switch
            {
                FeedbackTextQuestion => FeedbackQuestionType.Text,
                FeedbackRatingQuestion => FeedbackQuestionType.Rating,
                FeedbackChoiceQuestion fc => fc.AllowMultiple ? FeedbackQuestionType.MultipleChoice : FeedbackQuestionType.SingleChoice,
                _ => throw new InvalidOperationException("Unknown question type")
            };

            var placeholder = (q as FeedbackTextQuestion)?.Placeholder;
            var options = (q as FeedbackChoiceQuestion)?.Options.Select(o => o.Value).ToArray();
            var minRating = (q as FeedbackRatingQuestion)?.MinRating;
            var maxRating = (q as FeedbackRatingQuestion)?.MaxRating;
            var ratingLabels = (q as FeedbackRatingQuestion)?.RatingLabels;

            var dependencies = q.Dependencies.Select(d => new FeedbackDependencyDto(d.DependsOnQuestionId, d.ConditionValue)).ToArray();

            return new GetFeedbackQuestionDto(
                q.Id, q.Question, type, q.Required, placeholder,
                options, minRating, maxRating, ratingLabels, q.Order, dependencies);
        }).ToList();

        return Results.Ok(dtos);
    }

    public static async Task<IResult> CreateFeedback(CreateFeedbackRequestDto[] feedbackRequestDtos,
        TadeoTDbContext context)
    {
        if (feedbackRequestDtos.Length == 0)
        {
            return Results.BadRequest("No feedback provided");
        }

        foreach (var feedbackRequestDto in feedbackRequestDtos)
        {
            if (await context.FeedbackQuestions
                    .FindAsync(feedbackRequestDto.QuestionId) == null)
            {
                return Results.BadRequest($"Question with id {feedbackRequestDto.QuestionId} was not found");
            }

            await context.FeedbackQuestionAnswers.AddAsync(new FeedbackQuestionAnswer
            {
                Answer = feedbackRequestDto.Answer,
                FeedbackQuestionId = feedbackRequestDto.QuestionId
            });
        }

        await context.SaveChangesAsync();

        return Results.Ok();
    }

    public static async Task<IResult> SaveFeedbackQuestions(UpsertFeedbackQuestionDto[] dtos, TadeoTDbContext context)
    {
        var incomingIds = dtos.Where(dto => dto.Id.HasValue).Select(dto => dto.Id!.Value).ToList();

        // Batch fetch existing questions
        var existingQuestionsDict = await context.FeedbackQuestions
            .Include(q => q.Dependencies)
            .Include(q => ((FeedbackChoiceQuestion)q).Options)
            .Where(q => incomingIds.Contains(q.Id))
            .ToDictionaryAsync(q => q.Id);

        var questionsToDelete = await context.FeedbackQuestions
            .Where(q => !incomingIds.Contains(q.Id))
            .ToListAsync();

        context.FeedbackQuestions.RemoveRange(questionsToDelete);

        foreach (var dto in dtos)
        {
            if (dto.Id.HasValue && existingQuestionsDict.TryGetValue(dto.Id.Value, out var existingQuestion))
            {
                await UpdateFeedbackQuestion(dto, existingQuestion, context);
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
            .Select(f => new
            {
                f.FeedbackQuestion!.Question,
                f.Answer
            })
            .ToListAsync();

        // Create CSV content
        var csvBuilder = new StringBuilder();

        // Add headers
        csvBuilder.AppendLine("Question;Answer");

        // Add data rows
        foreach (var item in feedbackAnswers)
        {
            var escapedQuestion = Utils.EscapeCsvField(item.Question);
            var escapedAnswer = Utils.EscapeCsvField(item.Answer);

            csvBuilder.AppendLine($"{escapedQuestion};{escapedAnswer}");
        }

        var csvBytes = Utils.ToUtf8Bom(csvBuilder.ToString());

        return Results.File(
            fileContents: csvBytes,
            contentType: "text/csv",
            fileDownloadName: "feedback_answers.csv"
        );
    }

    private static async Task UpdateFeedbackQuestion(UpsertFeedbackQuestionDto dto, FeedbackQuestion existingQuestion, TadeoTDbContext context)
    {
        bool typeMismatch = false;
        switch (existingQuestion)
        {
            case FeedbackTextQuestion tq when dto.Type == FeedbackQuestionType.Text:
                tq.Placeholder = dto.Placeholder;
                break;
            case FeedbackRatingQuestion rq when dto.Type == FeedbackQuestionType.Rating:
                rq.MinRating = dto.MinRating ?? 1;
                rq.MaxRating = dto.MaxRating ?? 5;
                rq.RatingLabels = dto.RatingLabels;
                break;
            case FeedbackChoiceQuestion cq when (dto.Type == FeedbackQuestionType.SingleChoice || dto.Type == FeedbackQuestionType.MultipleChoice):
                cq.AllowMultiple = dto.Type == FeedbackQuestionType.MultipleChoice;
                // Options are already loaded via Include in SaveFeedbackQuestions
                cq.Options.Clear();
                if (dto.Options != null)
                {
                    foreach (var opt in dto.Options)
                    {
                        cq.Options.Add(new FeedbackOption { Value = opt, FeedbackQuestion = cq });
                    }
                }
                break;
            default:
                typeMismatch = true;
                break;
        }

        if (typeMismatch)
        {
            context.FeedbackQuestions.Remove(existingQuestion);
            await AddFeedbackQuestion(dto, context);
        }
        else
        {
            existingQuestion.Question = dto.Question;
            existingQuestion.Required = dto.Required;
            existingQuestion.Order = dto.Order;

            // Update dependencies
            // Dependencies are already loaded via Include in SaveFeedbackQuestions
            existingQuestion.Dependencies.Clear();
            if (dto.Dependencies != null)
            {
                foreach (var depDto in dto.Dependencies)
                {
                    existingQuestion.Dependencies.Add(new FeedbackDependency
                    {
                        Question = existingQuestion,
                        DependsOnQuestionId = depDto.DependsOnQuestionId,
                        ConditionValue = depDto.ConditionValue,
                        DependsOnQuestion = null! // EF Core will resolve this via ID
                    });
                }
            }
        }
    }

    private static async Task AddFeedbackQuestion(UpsertFeedbackQuestionDto dto, TadeoTDbContext context)
    {
        FeedbackQuestion newQuestion = dto.Type switch
        {
            FeedbackQuestionType.Text => new FeedbackTextQuestion
            {
                Question = dto.Question,
                Required = dto.Required,
                Order = dto.Order,
                Placeholder = dto.Placeholder
            },
            FeedbackQuestionType.Rating => new FeedbackRatingQuestion
            {
                Question = dto.Question,
                Required = dto.Required,
                Order = dto.Order,
                MinRating = dto.MinRating ?? 1,
                MaxRating = dto.MaxRating ?? 5,
                RatingLabels = dto.RatingLabels
            },
            var t when (t == FeedbackQuestionType.SingleChoice || t == FeedbackQuestionType.MultipleChoice) => new FeedbackChoiceQuestion
            {
                Question = dto.Question,
                Required = dto.Required,
                Order = dto.Order,
                AllowMultiple = t == FeedbackQuestionType.MultipleChoice,
                Options = dto.Options?.Select(o => new FeedbackOption { Value = o, FeedbackQuestion = null! }).ToList() ?? []
            },
            _ => throw new ArgumentException($"Unknown question type: {dto.Type}")
        };

        if (newQuestion is FeedbackChoiceQuestion fcq && fcq.Options.Count > 0)
        {
            foreach (var opt in fcq.Options) opt.FeedbackQuestion = fcq;
        }

        if (dto.Dependencies != null)
        {
            foreach (var depDto in dto.Dependencies)
            {
                newQuestion.Dependencies.Add(new FeedbackDependency
                {
                    Question = newQuestion,
                    DependsOnQuestionId = depDto.DependsOnQuestionId,
                    ConditionValue = depDto.ConditionValue,
                    DependsOnQuestion = null!
                });
            }
        }

        await context.FeedbackQuestions.AddAsync(newQuestion);
    }
}

public record UpsertFeedbackQuestionDto(
    int? Id,
    [Required, MaxLength(255)] string Question,
    FeedbackQuestionType Type,
    bool Required,
    [MaxLength(100)] string? Placeholder,
    string[]? Options,
    [Range(1, 9)] int? MinRating,
    [Range(2, 10)] int? MaxRating,
    [MaxLength(100)] string? RatingLabels,
    [Range(0, int.MaxValue)] int Order,
    FeedbackDependencyDto[]? Dependencies
);

public record GetFeedbackQuestionDto(
    int Id,
    [Required, MaxLength(255)] string Question,
    FeedbackQuestionType Type,
    bool Required,
    string? Placeholder,
    string[]? Options,
    int? MinRating,
    int? MaxRating,
    string? RatingLabels,
    [Range(0, int.MaxValue)] int Order,
    FeedbackDependencyDto[] Dependencies);

public record CreateFeedbackRequestDto(
    int QuestionId,
    [Required, MaxLength(1000)] string Answer
);

public record GetFeedbackAnswerDto(string Answer);

public record FeedbackDependencyDto(
    int DependsOnQuestionId,
    [Required, MaxLength(255)] string ConditionValue
);