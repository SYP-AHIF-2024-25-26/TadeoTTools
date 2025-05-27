using Microsoft.AspNetCore.Mvc;

namespace API.Endpoints.FeedbackManagement;

public static class FeedbackManagementApi
{
    public static void MapFeedbackEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");
        group.MapGet("feedback-questions", FeedbackManagementEndpoints.GetFeedbackQuestions)
            .WithName(nameof(FeedbackManagementEndpoints.GetFeedbackQuestions))
            .WithDescription("Get all feedback questions")
            .Produces<List<GetFeedbackQuestionDto>>();

        group.MapGet("get-answers/{id:int}", FeedbackManagementEndpoints.GetAnswersOfQuestion)
            .WithName(nameof(FeedbackManagementEndpoints.GetAnswersOfQuestion))
            .WithDescription("Get all answers of a question")
            .Produces<List<GetFeedbackAnswerDto>>()
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("add-feedbacks", FeedbackManagementEndpoints.CreateFeedback)
            .WithName(nameof(FeedbackManagementEndpoints.CreateFeedback))
            .WithDescription("Create a new feedback")
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK);

        group.MapPost("save-questions", FeedbackManagementEndpoints.SaveFeedbackQuestions)
            .WithName(nameof(FeedbackManagementEndpoints.SaveFeedbackQuestions))
            .WithDescription("Saves all questions")
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapGet("get-answers-csv", FeedbackManagementEndpoints.GetFeedbackAnswersCsv)
            .WithName(nameof(FeedbackManagementEndpoints.GetFeedbackAnswersCsv))
            .WithDescription("Get all answers in a csv file")
            .Produces(StatusCodes.Status206PartialContent)
            .Produces(StatusCodes.Status416RangeNotSatisfiable);
    }
}