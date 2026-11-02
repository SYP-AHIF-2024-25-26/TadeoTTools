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
public class KioskStaffAuthorizationTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
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
        (await IsAllowed(User("lehrer", TeacherDn), KioskStaffRequirement.ReceptionStopName)).Should().BeTrue();
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
    public async Task Student_ShouldBeAllowedToRegister_OnlyWhenAcceptedAtEmpfang()
    {
        await AssignAsync("if200001", "Empfang", Status.ACCEPTED);

        (await IsAllowed(User("if200001", StudentDn), KioskStaffRequirement.ReceptionStopName)).Should().BeTrue();
        (await IsAllowed(User("if200001", StudentDn))).Should().BeFalse();
    }

    [Fact]
    public async Task Student_ShouldNotBeAllowedToRegister_WhenAcceptedAtBuffet()
    {
        await AssignAsync("if200001", "Buffet", Status.ACCEPTED);

        (await IsAllowed(User("if200001", StudentDn), KioskStaffRequirement.ReceptionStopName)).Should().BeFalse();
    }

    [Fact]
    public async Task StudentStopManager_ShouldNotBeAllowedToRegister_WithoutAssignmentToEmpfang()
    {
        DbContext.StopManagers.Add(new StopManager { EdufsUsername = "if200001" });
        await DbContext.SaveChangesAsync();

        (await IsAllowed(User("if200001", StudentDn), KioskStaffRequirement.ReceptionStopName)).Should().BeFalse();
    }

    [Fact]
    public async Task StopManager_ShouldSeePhotos_OnlyAtTheRoboterfuehrerscheinStop()
    {
        await ManageAsync("if200001", "Roboterführerschein");
        await ManageAsync("if200002", "Robotics");

        (await IsPhotoViewer(User("IF200001", StudentDn))).Should().BeTrue();
        (await IsPhotoViewer(User("if200002", StudentDn))).Should().BeFalse();
        // The stop-manager check is only on for the photos.
        (await IsAllowed(User("if200001", StudentDn))).Should().BeFalse();
    }

    [Theory]
    [InlineData(Status.ACCEPTED, true)]
    [InlineData(Status.PENDING, false)]
    public async Task Student_ShouldSeePhotos_OnlyWhenAcceptedAtRoboterfuehrerschein(Status status, bool allowed)
    {
        await AssignAsync("if200001", "Roboterführerschein", status);

        (await IsPhotoViewer(User("if200001", StudentDn))).Should().Be(allowed);
    }

    [Fact]
    public async Task Teacher_ShouldNotSeePhotos_WithoutTheStop()
    {
        (await IsPhotoViewer(User("lehrer", TeacherDn))).Should().BeFalse();

        await ManageAsync("lehrer", "Roboterführerschein");
        (await IsPhotoViewer(User("lehrer", TeacherDn))).Should().BeTrue();
    }

    [Fact]
    public async Task Admin_ShouldSeePhotos_ButNotBeAtTheStop()
    {
        DbContext.Admins.Add(new Admin { Id = "if200001" });
        await DbContext.SaveChangesAsync();

        (await IsPhotoViewer(User("if200001", StudentDn))).Should().BeTrue();
        (await PhotoViewer(User("if200001", StudentDn))).Should().Be(new UserManagementEndpoints.PhotoViewerDto(false));
    }

    [Fact]
    public async Task PhotoViewer_ShouldBeAtTheStop_ForItsStopManager()
    {
        await ManageAsync("if200001", "Roboterführerschein");

        (await PhotoViewer(User("IF200001", StudentDn))).Should().Be(new UserManagementEndpoints.PhotoViewerDto(true));
    }

    [Fact]
    public async Task Admin_ShouldBeAllowed()
    {
        DbContext.Admins.Add(new Admin { Id = "if200001" });
        await DbContext.SaveChangesAsync();

        (await IsAllowed(User("if200001", StudentDn))).Should().BeTrue();
        (await IsAllowed(User("if200001", StudentDn), KioskStaffRequirement.ReceptionStopName)).Should().BeTrue();
    }

    [Fact]
    public async Task KioskUser_ShouldUseNameAndClassFromStudents_ForStudents()
    {
        DbContext.Students.Add(new Student
        {
            EdufsUsername = "if200001", FirstName = "Max", LastName = "Muster", StudentClass = "5AHIF"
        });
        await DbContext.SaveChangesAsync();

        var user = await KioskUser(User("IF200001", StudentDn));

        user.Should().Be(new UserManagementEndpoints.KioskUserDto("Max Muster", "5AHIF"));
    }

    [Fact]
    public async Task KioskUser_ShouldUseTokenNameWithoutClass_ForTeachers()
    {
        var teacher = User("lehrer", TeacherDn);
        ((ClaimsIdentity)teacher.Identity!).AddClaims([
            new Claim(ClaimTypes.GivenName, "Lisa"), new Claim(ClaimTypes.Surname, "Lehrer")
        ]);

        var user = await KioskUser(teacher);

        user.Should().Be(new UserManagementEndpoints.KioskUserDto("Lisa Lehrer", ""));
    }

    private async Task<UserManagementEndpoints.KioskUserDto> KioskUser(ClaimsPrincipal user)
    {
        var result = await UserManagementEndpoints.GetKioskUser(DbContext, new DefaultHttpContext { User = user });
        return result.Should().BeOfType<Ok<UserManagementEndpoints.KioskUserDto>>().Subject.Value!;
    }

    private async Task AssignAsync(string username, string stopName, Status status)
    {
        var stop = new Stop { Name = stopName, Description = "", RoomNr = "" };
        DbContext.Students.Add(new Student { EdufsUsername = username });
        DbContext.StudentAssignments.Add(new StudentAssignment { EdufsUsername = username, Stop = stop, Status = status });
        await DbContext.SaveChangesAsync();
    }

    private async Task ManageAsync(string username, string stopName)
    {
        var stop = new Stop { Name = stopName, Description = "", RoomNr = "" };
        DbContext.StopManagers.Add(new StopManager { EdufsUsername = username });
        DbContext.StopManagerAssignments.Add(new StopManagerAssignment { StopManagerId = username, Stop = stop });
        await DbContext.SaveChangesAsync();
    }

    private Task<bool> IsPhotoViewer(ClaimsPrincipal user) => IsAllowed(KioskStaffRequirement.PhotoViewer, user);

    private async Task<UserManagementEndpoints.PhotoViewerDto> PhotoViewer(ClaimsPrincipal user)
    {
        var result = await UserManagementEndpoints.GetPhotoViewer(DbContext, new DefaultHttpContext { User = user });
        return result.Should().BeOfType<Ok<UserManagementEndpoints.PhotoViewerDto>>().Subject.Value!;
    }

    private Task<bool> IsAllowed(ClaimsPrincipal user, string stopName = KioskStaffRequirement.BuffetStopName) =>
        IsAllowed(new KioskStaffRequirement(stopName), user);

    private async Task<bool> IsAllowed(KioskStaffRequirement requirement, ClaimsPrincipal user)
    {
        var context = new AuthorizationHandlerContext([requirement], user, null);
        await new KioskStaffAuthorizationHandler(DbContext).HandleAsync(context);
        return context.HasSucceeded;
    }

    private static ClaimsPrincipal User(string username, string ldapDn) =>
        new(new ClaimsIdentity([new Claim("preferred_username", username), new Claim("LDAP_ENTRY_DN", ldapDn)],
            "Test"));
}
