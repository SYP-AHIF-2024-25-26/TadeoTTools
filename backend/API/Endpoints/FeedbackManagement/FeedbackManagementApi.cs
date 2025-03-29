using Database.Entities;

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
            .WithDescription("Create a new feedback");

    }
}