using Database.Entities;
using NUnit.Framework;

namespace TadeoTUnitTests.Entities;

[TestFixture]
public class FeedbackSessionEntityTests
{
    [Test]
    public void FeedbackSession_ShouldStartWithEmptyAnswers()
    {
        var session = new FeedbackSession();
        Assert.That(session.FeedbackQuestionAnswers, Is.Empty);
    }

    [Test]
    public void FeedbackSession_ShouldStoreValues_WhenPropertiesAreSet()
    {
        var now = DateTime.UtcNow;
        var session = new FeedbackSession
        {
            Id = 1,
            Timestamp = now
        };

        Assert.That(session.Id, Is.EqualTo(1));
        Assert.That(session.Timestamp, Is.EqualTo(now));
    }

    [Test]
    public void FeedbackSession_ShouldBeAbleToAddAnswers()
    {
        var session = new FeedbackSession();
        var answer = new FeedbackQuestionAnswer 
        { 
            Answer = "Test Answer", 
            FeedbackQuestionId = 1 
        };

        session.FeedbackQuestionAnswers.Add(answer);

        Assert.That(session.FeedbackQuestionAnswers, Has.Count.EqualTo(1));
        Assert.That(session.FeedbackQuestionAnswers[0], Is.EqualTo(answer));
    }
}
