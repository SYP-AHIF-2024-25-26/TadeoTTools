using Database.Entities;
using Microsoft.AspNetCore.Mvc;

namespace API.Endpoints.FeedbackManagement;

public static class FeedbackManagementApi
{
    public static void MapFeedbackEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");
        group.MapGet("feedbacks", FeedbackManagementEndpoints.GetFeedbacks)
            .WithName(nameof(FeedbackManagementEndpoints.GetFeedbacks))
            .WithDescription("Get all feedbacks")
            .Produces<List<GetFeedbackQuestionDto>>();

        group.MapPost("add-feedbacks", FeedbackManagementEndpoints.CreateFeedback)
            .WithName(nameof(FeedbackManagementEndpoints.CreateFeedback))
            .WithDescription("Create a new feedback")
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK);

        group.MapPost("add-feedback-question", FeedbackManagementEndpoints.CreateFeedbackQuestion)
            .WithName(nameof(FeedbackManagementEndpoints.CreateFeedbackQuestion))
            .WithDescription("Create a new feedback question")
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);
        
        group.MapDelete("delete-feedback-question/{id}", FeedbackManagementEndpoints.DeleteFeedbackQuestion)
            .WithName(nameof(FeedbackManagementEndpoints.DeleteFeedbackQuestion))
            .WithDescription("Delete a feedback question by its id")
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

    }
}