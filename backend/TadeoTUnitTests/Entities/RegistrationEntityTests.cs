using Database.Entities;
using NUnit.Framework;

namespace TadeoTUnitTests.Entities;

[TestFixture]
public class RegistrationEntityTests
{
    private static City Leonding() => new() { ZipCode = "4060", Name = "Leonding", Number = 41011 };

    [Test]
    public void City_ShouldBeValid_WhenPropertiesAreWithinLimits()
    {
        var results = ValidationHelper.ValidateModel(Leonding());
        Assert.That(results, Is.Empty);
    }

    [TestCase("406")]
    [TestCase("40600")]
    [TestCase("0406")]
    [TestCase("40a0")]
    public void City_ShouldBeInvalid_WhenZipCodeIsNoAustrianPostcode(string zipCode)
    {
        var city = Leonding();
        city.ZipCode = zipCode;

        var results = ValidationHelper.ValidateModel(city);
        ValidationHelper.AssertPropertyError(results, nameof(City.ZipCode));
    }

    [Test]
    public void City_ShouldBeInvalid_WhenNumberHasNotFiveDigits()
    {
        var city = Leonding();
        city.Number = 4101;

        var results = ValidationHelper.ValidateModel(city);
        ValidationHelper.AssertPropertyError(results, nameof(City.Number));
    }

    [Test]
    public void District_ShouldBeInvalid_WhenNumberHasNotThreeDigits()
    {
        var district = new District { Number = 4101, Name = "Linz-Land" };

        var results = ValidationHelper.ValidateModel(district);
        ValidationHelper.AssertPropertyError(results, nameof(District.Number));
    }

    [Test]
    public void District_ShouldBeInvalid_WhenNameIsTooLong()
    {
        var district = new District { Number = 410, Name = new string('a', 101) };

        var results = ValidationHelper.ValidateModel(district);
        ValidationHelper.AssertPropertyError(results, nameof(District.Name));
    }

    [Test]
    public void RegistrationOption_ShouldBeInvalid_WhenNameIsEmpty()
    {
        var option = new RegistrationOption { Kind = RegistrationOptionKind.SchoolType, Name = "" };

        var results = ValidationHelper.ValidateModel(option);
        ValidationHelper.AssertPropertyError(results, nameof(RegistrationOption.Name));
    }

    [TestCase(-1)]
    [TestCase(5)]
    public void Visitor_ShouldBeInvalid_WhenAdultsAreOutOfRange(int adults)
    {
        var visitor = new Visitor { Adults = adults, SchoolLevel = 8 };

        var results = ValidationHelper.ValidateModel(visitor);
        ValidationHelper.AssertPropertyError(results, nameof(Visitor.Adults));
    }

    [TestCase(6)]
    [TestCase(14)]
    public void Visitor_ShouldBeInvalid_WhenSchoolLevelIsOutOfRange(int level)
    {
        var visitor = new Visitor { SchoolLevel = level };

        var results = ValidationHelper.ValidateModel(visitor);
        ValidationHelper.AssertPropertyError(results, nameof(Visitor.SchoolLevel));
    }

    [Test]
    public void Visitor_ShouldBeInvalid_WhenCommentIsTooLong()
    {
        var visitor = new Visitor { SchoolLevel = 8, Comment = new string('a', 101) };

        var results = ValidationHelper.ValidateModel(visitor);
        ValidationHelper.AssertPropertyError(results, nameof(Visitor.Comment));
    }
}
