using Database.Entities;
using NUnit.Framework;

namespace TadeoTUnitTests.Entities;

[TestFixture]
public class FeedbackEntityTests
{
    [Test]
    public void FeedbackQuestion_ShouldBeInvalid_WhenQuestionIsTooLong()
    {
        var question = new FeedbackTextQuestion
        {
            Question = new string('a', 256),
            Required = true
        };

        var results = ValidationHelper.ValidateModel(question);
        ValidationHelper.AssertPropertyError(results, nameof(FeedbackQuestion.Question));
    }

    [Test]
    public void FeedbackRatingQuestion_ShouldBeInvalid_WhenMinRatingIsOutOfRange()
    {
        var question = new FeedbackRatingQuestion
        {
            Question = "Rating?",
            MinRating = 0, // Valid range 1-9
            MaxRating = 5
        };

        var results = ValidationHelper.ValidateModel(question);
        ValidationHelper.AssertPropertyError(results, nameof(FeedbackRatingQuestion.MinRating));
    }

    [Test]
    public void FeedbackRatingQuestion_ShouldBeInvalid_WhenMaxRatingIsOutOfRange()
    {
        var question = new FeedbackRatingQuestion
        {
            Question = "Rating?",
            MinRating = 1,
            MaxRating = 11 // Valid range 2-10
        };

        var results = ValidationHelper.ValidateModel(question);
        ValidationHelper.AssertPropertyError(results, nameof(FeedbackRatingQuestion.MaxRating));
    }

    [Test]
    public void FeedbackOption_ShouldBeInvalid_WhenValueIsTooLong()
    {
        var option = new FeedbackOption
        {
            Value = new string('a', 256),
            FeedbackQuestion = new FeedbackChoiceQuestion { Question = "Q", AllowMultiple = false }
        };

        var results = ValidationHelper.ValidateModel(option);
        ValidationHelper.AssertPropertyError(results, nameof(FeedbackOption.Value));
    }
}
