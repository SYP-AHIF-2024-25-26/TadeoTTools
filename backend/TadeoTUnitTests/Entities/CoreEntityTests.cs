using Database.Entities;
using NUnit.Framework;

namespace TadeoTUnitTests.Entities;

[TestFixture]
public class CoreEntityTests
{
    [Test]
    public void Stop_ShouldBeInvalid_WhenNameIsTooLong()
    {
        var stop = new Stop
        {
            Name = new string('a', 101),
            Description = "Valid",
            RoomNr = "1.01"
        };

        var results = ValidationHelper.ValidateModel(stop);
        ValidationHelper.AssertPropertyError(results, nameof(Stop.Name));
    }

    [Test]
    public void Stop_ShouldBeInvalid_WhenRoomNrIsTooLong()
    {
        var stop = new Stop
        {
            Name = "Valid",
            Description = "Valid",
            RoomNr = new string('a', 51)
        };

        var results = ValidationHelper.ValidateModel(stop);
        ValidationHelper.AssertPropertyError(results, nameof(Stop.RoomNr));
    }

    [Test]
    public void Stop_ShouldBeValid_WhenPropertiesAreWithinLimits()
    {
        var stop = new Stop
        {
            Name = new string('a', 100),
            Description = "Valid",
            RoomNr = "1.01"
        };

        var results = ValidationHelper.ValidateModel(stop);
        Assert.That(results, Is.Empty);
    }

    [Test]
    public void Division_ShouldBeInvalid_WhenColorIsInvalid()
    {
        var division = new Division
        {
            Name = "Div",
            Color = "#GGGGGG" // Invalid hex, but valid length (7)
        };

        var results = ValidationHelper.ValidateModel(division);
        ValidationHelper.AssertPropertyError(results, nameof(Division.Color), "must be a valid hex code");
    }

    [Test]
    public void Division_ShouldBeValid_WhenColorIsValid()
    {
        var division = new Division
        {
            Name = "Div",
            Color = "#FF0000"
        };

        var results = ValidationHelper.ValidateModel(division);
        Assert.That(results, Is.Empty);
    }

    [Test]
    public void StopGroup_ShouldBeInvalid_WhenDescriptionIsTooLong()
    {
        var group = new StopGroup
        {
            Name = "Group",
            Description = new string('a', 3001),
            IsPublic = true
        };

        var results = ValidationHelper.ValidateModel(group);
        ValidationHelper.AssertPropertyError(results, nameof(StopGroup.Description));
    }
}
