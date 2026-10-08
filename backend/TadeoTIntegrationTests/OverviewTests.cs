using System.Net;
using System.Net.Http.Json;
using API.Endpoints.OverviewManagement;
using Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace TadeoTIntegrationTests;

public class OverviewTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private const string BaseUrl = "/v1/api/overview";

    [Fact]
    public async Task GetOverview_ShouldReturnEmptyOverview_WhenDatabaseIsEmpty()
    {
        // Arrange
        await ClearAsync();

        // Act
        var response = await Client.GetAsync(BaseUrl);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var overview = await response.Content.ReadFromJsonAsync<OverviewEndpoints.OverviewDto>();
        overview.Should().NotBeNull();
        overview!.Stops.Should().BeEmpty();
        overview.Groups.Should().BeEmpty();
        overview.Students.Should().Be(new OverviewEndpoints.OverviewStudentsDto(0, 0, 0, 0, 0));
        overview.FeedbackSessionCount.Should().Be(0);
        overview.LatestFeedbackAt.Should().BeNull();
        overview.Countdown.IsEnabled.Should().BeFalse();
    }

    [Fact]
    public async Task GetOverview_ShouldCountStudentStatesTourAndStopGaps()
    {
        // Arrange
        await ClearAsync();
        var division = new Division { Name = "Informatik", Color = "#0059A7" };
        var staffed = new Stop
        {
            Name = "Robotics", Description = "<p>Robots</p>", RoomNr = "E01", Divisions = [division]
        };
        var emptyDescription = new Stop { Name = "Buffet", Description = "<p></p>", RoomNr = "" };
        var outsideTour = new Stop { Name = "Lab", Description = "Lab tour", RoomNr = "U12" };

        var manager = new StopManager { EdufsUsername = "teacher", FirstName = "T", LastName = "Eacher" };
        staffed.StopManagerAssignments.Add(new StopManagerAssignment { StopManagerId = "teacher", StopManager = manager });

        var tour = new StopGroup { Name = "Tour", Description = "", IsPublic = true, Order = 1 };
        tour.StopAssignments.Add(new StopGroupAssignment { Stop = emptyDescription, Order = 2 });
        tour.StopAssignments.Add(new StopGroupAssignment { Stop = staffed, Order = 1 });
        var hidden = new StopGroup { Name = "Hidden", Description = "", IsPublic = false, Order = 0 };

        DbContext.StopGroups.AddRange(tour, hidden);
        DbContext.Stops.Add(outsideTour);
        DbContext.Students.AddRange(
            CreateStudent("approved", (staffed, Status.ACCEPTED)),
            CreateStudent("pending", (staffed, Status.PENDING)),
            CreateStudent("conflict", (staffed, Status.PENDING), (emptyDescription, Status.PENDING)),
            CreateStudent("oldrejected", (staffed, Status.DECLINED)),
            CreateStudent("none"));
        DbContext.FeedbackSessions.Add(new FeedbackSession { Timestamp = new DateTime(2026, 1, 23, 10, 0, 0, DateTimeKind.Utc) });
        DbContext.FeatureFlags.Add(new FeatureFlag { FeatureKey = "showCountdown", IsEnabled = true, Value = "2027-01-22" });
        await DbContext.SaveChangesAsync();

        // Act
        var overview = await Client.GetFromJsonAsync<OverviewEndpoints.OverviewDto>(BaseUrl);

        // Assert
        overview.Should().NotBeNull();
        overview!.Students.Should().Be(new OverviewEndpoints.OverviewStudentsDto(
            Total: 5, Approved: 1, Pending: 1, Conflict: 1, Unassigned: 2));

        overview.Groups.Select(g => g.Name).Should().Equal("Hidden", "Tour");
        overview.Groups.Single(g => g.Name == "Tour").StopIds.Should().Equal(staffed.Id, emptyDescription.Id);
        overview.Groups.Single(g => g.Name == "Hidden").IsPublic.Should().BeFalse();

        var robotics = overview.Stops.Single(s => s.Id == staffed.Id);
        robotics.HasDescription.Should().BeTrue();
        robotics.DivisionColors.Should().Equal("#0059A7");
        robotics.ManagerCount.Should().Be(1);
        robotics.ApprovedStudentCount.Should().Be(1);
        robotics.PendingStudentCount.Should().Be(2);

        var buffet = overview.Stops.Single(s => s.Id == emptyDescription.Id);
        buffet.HasDescription.Should().BeFalse();
        buffet.RoomNr.Should().BeEmpty();
        buffet.ManagerCount.Should().Be(0);

        overview.DivisionCount.Should().Be(1);
        overview.StopManagerCount.Should().Be(1);
        overview.FeedbackSessionCount.Should().Be(1);
        overview.LatestFeedbackAt.Should().NotBeNull();
        overview.Countdown.Should().Be(new OverviewEndpoints.OverviewCountdownDto(true, "2027-01-22"));
    }

    // The API imports the development CSVs into empty tables at startup; start from a clean slate.
    private async Task ClearAsync()
    {
        await DbContext.StudentAssignments.ExecuteDeleteAsync();
        await DbContext.Students.ExecuteDeleteAsync();
        await DbContext.StopManagerAssignments.ExecuteDeleteAsync();
        await DbContext.StopManagers.ExecuteDeleteAsync();
        await DbContext.StopGroupAssignments.ExecuteDeleteAsync();
        await DbContext.StopGroups.ExecuteDeleteAsync();
        await DbContext.Stops.ExecuteDeleteAsync();
        await DbContext.Divisions.ExecuteDeleteAsync();
        await DbContext.FeedbackQuestionAnswers.ExecuteDeleteAsync();
        await DbContext.FeedbackSessions.ExecuteDeleteAsync();
        await DbContext.FeatureFlags.ExecuteDeleteAsync();
    }

    private static Student CreateStudent(string username, params (Stop Stop, Status Status)[] assignments) => new()
    {
        EdufsUsername = username,
        FirstName = username,
        LastName = username,
        StudentClass = "5AHIF",
        Department = "HIF",
        StudentAssignments = assignments
            .Select(a => new StudentAssignment { EdufsUsername = username, Stop = a.Stop, Status = a.Status })
            .ToList()
    };
}
