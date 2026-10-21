using System.Security.Claims;
using API;
using API.Endpoints.UserManagement;
using Database.Entities;
using FluentAssertions;
using LeoAuth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Xunit;

namespace TadeoTIntegrationTests;

// FakePolicyEvaluator authorizes every request, so the handler is called directly here.
public class CashierAuthorizationTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private const string TeacherDn = "CN=lehrer,OU=Teachers,OU=HTL-Leonding,DC=EDU,DC=HTL-LEONDING,DC=AC,DC=AT";
    private const string StudentDn = "CN=if200001,OU=Students,OU=HTL-Leonding,DC=EDU,DC=HTL-LEONDING,DC=AC,DC=AT";

    [Fact]
    public void TeacherToken_ShouldBeRecognisedByLeoAuth()
    {
        User("lehrer", TeacherDn).GetLeoUserInformation()
            .Match(user => user.IsTeacher, _ => false)
            .Should().BeTrue();
    }

    [Fact]
    public async Task Teacher_ShouldBeAllowed_WithoutAnyAssignment()
    {
        (await IsAllowed(User("lehrer", TeacherDn))).Should().BeTrue();
    }

    [Fact]
    public async Task Student_ShouldBeAllowed_WhenAcceptedAtBuffet()
    {
        await AssignAsync("if200001", "Buffet", Status.ACCEPTED);

        (await IsAllowed(User("IF200001", StudentDn))).Should().BeTrue();
    }

    [Theory]
    [InlineData("Buffet", Status.PENDING)]
    [InlineData("Buffet", Status.DECLINED)]
    [InlineData("Robotics", Status.ACCEPTED)]
    public async Task Student_ShouldBeDenied_WhenNotAcceptedAtBuffet(string stopName, Status status)
    {
        await AssignAsync("if200001", stopName, status);

        (await IsAllowed(User("if200001", StudentDn))).Should().BeFalse();
    }

    [Fact]
    public async Task Admin_ShouldBeAllowed()
    {
        DbContext.Admins.Add(new Admin { Id = "if200001" });
        await DbContext.SaveChangesAsync();

        (await IsAllowed(User("if200001", StudentDn))).Should().BeTrue();
    }

    [Fact]
    public async Task CashierUser_ShouldUseNameAndClassFromStudents_ForStudents()
    {
        DbContext.Students.Add(new Student
        {
            EdufsUsername = "if200001", FirstName = "Max", LastName = "Muster", StudentClass = "5AHIF"
        });
        await DbContext.SaveChangesAsync();

        var user = await CashierUser(User("IF200001", StudentDn));

        user.Should().Be(new UserManagementEndpoints.CashierUserDto("Max Muster", "5AHIF"));
    }

    [Fact]
    public async Task CashierUser_ShouldUseTokenNameWithoutClass_ForTeachers()
    {
        var teacher = User("lehrer", TeacherDn);
        ((ClaimsIdentity)teacher.Identity!).AddClaims([
            new Claim(ClaimTypes.GivenName, "Lisa"), new Claim(ClaimTypes.Surname, "Lehrer")
        ]);

        var user = await CashierUser(teacher);

        user.Should().Be(new UserManagementEndpoints.CashierUserDto("Lisa Lehrer", ""));
    }

    private async Task<UserManagementEndpoints.CashierUserDto> CashierUser(ClaimsPrincipal user)
    {
        var result = await UserManagementEndpoints.GetCashierUser(DbContext, new DefaultHttpContext { User = user });
        return result.Should().BeOfType<Ok<UserManagementEndpoints.CashierUserDto>>().Subject.Value!;
    }

    private async Task AssignAsync(string username, string stopName, Status status)
    {
        var stop = new Stop { Name = stopName, Description = "", RoomNr = "" };
        DbContext.Students.Add(new Student { EdufsUsername = username });
        DbContext.StudentAssignments.Add(new StudentAssignment { EdufsUsername = username, Stop = stop, Status = status });
        await DbContext.SaveChangesAsync();
    }

    private async Task<bool> IsAllowed(ClaimsPrincipal user)
    {
        var requirement = new CashierRequirement();
        var context = new AuthorizationHandlerContext([requirement], user, null);
        await new CashierAuthorizationHandler(DbContext).HandleAsync(context);
        return context.HasSucceeded;
    }

    private static ClaimsPrincipal User(string username, string ldapDn) =>
        new(new ClaimsIdentity([new Claim("preferred_username", username), new Claim("LDAP_ENTRY_DN", ldapDn)],
            "Test"));
}
