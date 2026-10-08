using System.Net;
using System.Net.Http.Json;
using API.Endpoints.FeedbackManagement;
using Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace TadeoTIntegrationTests;

public class FeedbackManagementTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    [Fact]
    public async Task GetFeedbackQuestions_ShouldReturnList()
    {
        // Act
        var response = await Client.GetAsync("/v1/feedback-questions");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var questions = await response.Content.ReadFromJsonAsync<List<GetFeedbackQuestionDto>>();
        questions.Should().NotBeNull();
    }

    [Fact]
    public async Task SaveFeedbackQuestions_ShouldUpsertQuestions()
    {
        // Arrange
        var dto = new UpsertFeedbackQuestionDto(
            null,
            "Test Question",
            FeedbackQuestionType.Text,
            true,
            "Placeholder",
            null,
            null,
            null,
            null,
            1,
            []
        );

        var payload = new[] { dto };

        // Act
        var response = await Client.PostAsJsonAsync("/v1/save-questions", payload);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbQuestion = await DbContext.FeedbackTextQuestions.FirstOrDefaultAsync(q => q.Question == "Test Question");
        dbQuestion.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateFeedback_ShouldReturnsOk_WhenValidWithoutAuth()
    {
        // Arrange
        var question = new FeedbackTextQuestion { Question = "Q1", Order = 1, Required = true };
        DbContext.FeedbackQuestions.Add(question);
        await DbContext.SaveChangesAsync();

        var dto = new CreateFeedbackRequestDto(question.Id, "Answer");
        var payload = new[] { dto };

        // Act
        var response = await Client.PostAsJsonAsync("/v1/add-feedbacks", payload);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbAnswer = await DbContext.FeedbackQuestionAnswers.FirstOrDefaultAsync(a => a.FeedbackQuestionId == question.Id);
        dbAnswer.Should().NotBeNull();
        dbAnswer!.Answer.Should().Be("Answer");
    }

    [Fact]
    public async Task GetFeedbackResponses_ShouldSummarizePerQuestion()
    {
        // Arrange
        var rating = new FeedbackRatingQuestion { Question = "How was it?", Order = 0, Required = true, MinRating = 1, MaxRating = 3 };
        var choice = new FeedbackChoiceQuestion
        {
            Question = "What did you like?", Order = 1, Required = false, AllowMultiple = true,
            Options = [new FeedbackOption { Value = "Labs", FeedbackQuestion = null! }, new FeedbackOption { Value = "Talks", FeedbackQuestion = null! }]
        };
        foreach (var o in choice.Options) o.FeedbackQuestion = choice;
        var text = new FeedbackTextQuestion { Question = "Anything else?", Order = 2, Required = false };
        DbContext.FeedbackQuestions.AddRange(rating, choice, text);
        await DbContext.SaveChangesAsync();

        DbContext.FeedbackSessions.AddRange(
            new FeedbackSession
            {
                Timestamp = new DateTime(2026, 1, 17, 10, 0, 0, DateTimeKind.Utc),
                FeedbackQuestionAnswers =
                [
                    new FeedbackQuestionAnswer { FeedbackQuestionId = rating.Id, Answer = "3" },
                    new FeedbackQuestionAnswer { FeedbackQuestionId = choice.Id, Answer = "Labs, Talks" },
                    new FeedbackQuestionAnswer { FeedbackQuestionId = text.Id, Answer = "Great" }
                ]
            },
            new FeedbackSession
            {
                Timestamp = new DateTime(2026, 1, 17, 11, 0, 0, DateTimeKind.Utc),
                FeedbackQuestionAnswers =
                [
                    new FeedbackQuestionAnswer { FeedbackQuestionId = rating.Id, Answer = "2" },
                    new FeedbackQuestionAnswer { FeedbackQuestionId = choice.Id, Answer = "Buffet" },
                    new FeedbackQuestionAnswer { FeedbackQuestionId = text.Id, Answer = "Too crowded" }
                ]
            });
        await DbContext.SaveChangesAsync();

        // Act
        var response = await Client.GetAsync("/v1/feedback-responses");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<FeedbackResponsesDto>();
        result!.ResponseCount.Should().Be(2);
        result.Questions.Select(q => q.QuestionId).Should().Equal(rating.Id, choice.Id, text.Id);

        var ratingSummary = result.Questions[0];
        ratingSummary.Average.Should().Be(2.5);
        ratingSummary.Counts.Select(c => c.Count).Should().Equal(0, 1, 1);

        var choiceSummary = result.Questions[1];
        choiceSummary.AnsweredCount.Should().Be(2);
        choiceSummary.Counts.Should().Equal(new FeedbackValueCountDto("Labs", 1), new FeedbackValueCountDto("Talks", 1));
        choiceSummary.OtherCount.Should().Be(1);

        result.Questions[2].TextAnswers.Select(t => t.Answer).Should().Equal("Too crowded", "Great");
    }

    [Fact]
    public async Task DeleteFeedbackResponses_ShouldRemoveAnswersAndKeepQuestions()
    {
        // Arrange
        var question = new FeedbackTextQuestion { Question = "Q1", Order = 0, Required = true };
        DbContext.FeedbackQuestions.Add(question);
        await DbContext.SaveChangesAsync();
        DbContext.FeedbackSessions.Add(new FeedbackSession
        {
            Timestamp = DateTime.UtcNow,
            FeedbackQuestionAnswers = [new FeedbackQuestionAnswer { FeedbackQuestionId = question.Id, Answer = "A" }]
        });
        await DbContext.SaveChangesAsync();

        // Act
        var response = await Client.DeleteAsync("/v1/feedback-responses");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await DbContext.FeedbackSessions.CountAsync()).Should().Be(0);
        (await DbContext.FeedbackQuestionAnswers.CountAsync()).Should().Be(0);
        (await DbContext.FeedbackQuestions.CountAsync()).Should().Be(1);
    }
}
