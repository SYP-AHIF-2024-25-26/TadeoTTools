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
            // saving recreates the options in list order, so ordering by Id keeps the entered order
            var options = (q as FeedbackChoiceQuestion)?.Options.OrderBy(o => o.Id).Select(o => o.Value).ToArray();
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

        var session = new FeedbackSession
        {
            Timestamp = DateTime.UtcNow
        };

        foreach (var feedbackRequestDto in feedbackRequestDtos)
        {
            if (await context.FeedbackQuestions
                    .FindAsync(feedbackRequestDto.QuestionId) == null)
            {
                return Results.BadRequest($"Question with id {feedbackRequestDto.QuestionId} was not found");
            }

            var answer = new FeedbackQuestionAnswer
            {
                Answer = feedbackRequestDto.Answer,
                FeedbackQuestionId = feedbackRequestDto.QuestionId,
                FeedbackSession = session
            };

            session.FeedbackQuestionAnswers.Add(answer);
        }

        await context.FeedbackSessions.AddAsync(session);
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
        var questions = await context.FeedbackQuestions
            .OrderBy(q => q.Order)
            .Select(q => new { q.Id, q.Question })
            .ToListAsync();

        var sessions = await context.FeedbackSessions
            .Include(s => s.FeedbackQuestionAnswers)
            .OrderBy(s => s.Timestamp)
            .ToListAsync();

        var csvBuilder = new StringBuilder();

        // Header: SessionId;Timestamp;Question1;Question2;...
        csvBuilder.Append("SessionId;Timestamp");
        foreach (var q in questions)
        {
            csvBuilder.Append($";{Utils.EscapeCsvField(q.Question)}");
        }
        csvBuilder.AppendLine();

        // One row per session
        foreach (var session in sessions)
        {
            var answersByQuestionId = session.FeedbackQuestionAnswers
                .ToDictionary(a => a.FeedbackQuestionId, a => a.Answer);

            csvBuilder.Append($"{session.Id};{Utils.EscapeCsvField(session.Timestamp.ToString("yyyy-MM-dd HH:mm:ss"))}");
            foreach (var q in questions)
            {
                var answer = answersByQuestionId.GetValueOrDefault(q.Id, "");
                csvBuilder.Append($";{Utils.EscapeCsvField(answer)}");
            }
            csvBuilder.AppendLine();
        }

        var csvBytes = Utils.ToUtf8Bom(csvBuilder.ToString());

        return Results.File(
            fileContents: csvBytes,
            contentType: "text/csv",
            fileDownloadName: "feedback_answers.csv"
        );
    }

    public static async Task<IResult> GetFeedbackResponses(TadeoTDbContext context)
    {
        var questions = await context.FeedbackQuestions
            .Include(q => ((FeedbackChoiceQuestion)q).Options)
            .OrderBy(q => q.Order)
            .ToListAsync();

        var answers = await context.FeedbackQuestionAnswers
            .Select(a => new { a.FeedbackQuestionId, a.Answer, a.FeedbackSession!.Timestamp })
            .ToListAsync();
        var answersByQuestion = answers.ToLookup(a => a.FeedbackQuestionId);

        var responseCount = await context.FeedbackSessions.CountAsync();
        var latestAt = await context.FeedbackSessions.MaxAsync(s => (DateTime?)s.Timestamp);

        var summaries = questions.Select(q =>
        {
            var given = answersByQuestion[q.Id]
                .Where(a => !string.IsNullOrWhiteSpace(a.Answer))
                .ToList();

            switch (q)
            {
                case FeedbackRatingQuestion rq:
                {
                    var ratings = given
                        .Select(a => int.TryParse(a.Answer, out var r) ? r : (int?)null)
                        .Where(r => r >= rq.MinRating && r <= rq.MaxRating)
                        .Select(r => r!.Value)
                        .ToList();
                    var counts = Enumerable.Range(rq.MinRating, rq.MaxRating - rq.MinRating + 1)
                        .Select(v => new FeedbackValueCountDto(v.ToString(), ratings.Count(r => r == v)))
                        .ToList();
                    return new FeedbackQuestionSummaryDto(q.Id, q.Question, FeedbackQuestionType.Rating,
                        given.Count, ratings.Count > 0 ? ratings.Average() : null, counts,
                        given.Count - ratings.Count, []);
                }
                case FeedbackChoiceQuestion cq:
                {
                    // Multiple choice answers are stored as the chosen options joined with ", ".
                    var chosen = given
                        .SelectMany(a => cq.AllowMultiple
                            ? a.Answer.Split(", ", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                            : [a.Answer.Trim()])
                        .ToList();
                    var optionValues = cq.Options.OrderBy(o => o.Id).Select(o => o.Value).ToList();
                    var counts = optionValues
                        .Select(o => new FeedbackValueCountDto(o, chosen.Count(c => c == o)))
                        .ToList();
                    var otherCount = chosen.Count(c => !optionValues.Contains(c));
                    return new FeedbackQuestionSummaryDto(q.Id, q.Question,
                        cq.AllowMultiple ? FeedbackQuestionType.MultipleChoice : FeedbackQuestionType.SingleChoice,
                        given.Count, null, counts, otherCount, []);
                }
                default:
                {
                    var texts = given
                        .OrderByDescending(a => a.Timestamp)
                        .Select(a => new FeedbackTextAnswerDto(a.Answer, a.Timestamp))
                        .ToList();
                    return new FeedbackQuestionSummaryDto(q.Id, q.Question, FeedbackQuestionType.Text,
                        given.Count, null, [], 0, texts);
                }
            }
        }).ToList();

        return Results.Ok(new FeedbackResponsesDto(responseCount, latestAt, summaries));
    }

    public static async Task<IResult> DeleteFeedbackResponses(TadeoTDbContext context)
    {
        // Answers are removed with their session by the cascade; the questions stay.
        await context.FeedbackSessions.ExecuteDeleteAsync();
        return Results.NoContent();
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

public record FeedbackResponsesDto(
    int ResponseCount,
    DateTime? LatestAt,
    List<FeedbackQuestionSummaryDto> Questions
);

public record FeedbackQuestionSummaryDto(
    int QuestionId,
    string Question,
    FeedbackQuestionType Type,
    int AnsweredCount,
    double? Average,
    List<FeedbackValueCountDto> Counts,
    int OtherCount,
    List<FeedbackTextAnswerDto> TextAnswers
);

public record FeedbackValueCountDto(string Value, int Count);

public record FeedbackTextAnswerDto(string Answer, DateTime Timestamp);

public record FeedbackDependencyDto(
    int DependsOnQuestionId,
    [Required, MaxLength(255)] string ConditionValue
);