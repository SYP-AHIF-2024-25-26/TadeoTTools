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
}
