using Database.Entities;
using NUnit.Framework;

namespace TadeoTUnitTests.Entities;

[TestFixture]
public class UserEntityTests
{
    [Test]
    public void Student_ShouldBeInvalid_WhenEdufsUsernameIsTooLong()
    {
        var student = new Student
        {
            EdufsUsername = new string('a', 101),
            FirstName = "First",
            LastName = "Last"
        };

        var results = ValidationHelper.ValidateModel(student);
        ValidationHelper.AssertPropertyError(results, nameof(Student.EdufsUsername));
    }

    [Test]
    public void Student_ShouldBeInvalid_WhenFirstNameIsTooLong()
    {
        var student = new Student
        {
            EdufsUsername = "user",
            FirstName = new string('a', 151),
            LastName = "Last"
        };

        var results = ValidationHelper.ValidateModel(student);
        ValidationHelper.AssertPropertyError(results, nameof(Student.FirstName));
    }

    [Test]
    public void StopManager_ShouldBeInvalid_WhenEdufsUsernameIsTooLong()
    {
        var manager = new StopManager
        {
            EdufsUsername = new string('a', 101),
            FirstName = "First",
            LastName = "Last"
        };

        var results = ValidationHelper.ValidateModel(manager);
        ValidationHelper.AssertPropertyError(results, nameof(StopManager.EdufsUsername));
    }

    [Test]
    public void Admin_ShouldBeInvalid_WhenIdIsTooLong()
    {
        var admin = new Admin
        {
            Id = new string('a', 51)
        };

        var results = ValidationHelper.ValidateModel(admin);
        ValidationHelper.AssertPropertyError(results, nameof(Admin.Id));
    }
}
