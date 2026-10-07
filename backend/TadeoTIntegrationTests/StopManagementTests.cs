using System.Net;
using System.Net.Http.Json;
using API.Endpoints.StopManagement;
using Database.Entities;
using Database.Repository.Functions;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace TadeoTIntegrationTests;

public class StopManagementTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private const string BaseUrl = "/v1/api/stops";

    [Fact]
    public async Task GetAllStops_ShouldReturnEmptyList_WhenNoStopsExist()
    {
        // Act
        var response = await Client.GetAsync(BaseUrl);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var stops = await response.Content.ReadFromJsonAsync<List<StopWithAssignmentsAndDivisionsDto>>();
        stops.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateStop_ShouldReturnOk_WhenStopIsValid()
    {
        // Arrange
        var stopDto = new StopManagementEndpoints.CreateStopRequestDto(
            "Test Stop",
            "Description",
            "1.01",
            "",
            [],
            [],
            [],
            []
        );

        // Act
        var response = await Client.PostAsJsonAsync(BaseUrl, stopDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbStop = await DbContext.Stops.FirstOrDefaultAsync(s => s.Name == "Test Stop");
        dbStop.Should().NotBeNull();
        dbStop!.RoomNr.Should().Be("1.01");
    }

    [Fact]
    public async Task GetStopById_ShouldReturnStop_WhenStopExists()
    {
        // Arrange
        var stop = new Stop
        {
            Name = "Get Stop",
            Description = "Desc",
            RoomNr = "2.02" // Removed UniqueId
        };
        DbContext.Stops.Add(stop);
        await DbContext.SaveChangesAsync();

        // Act
        var response = await Client.GetAsync($"{BaseUrl}/{stop.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<StopWithEverythingDto>();
        result.Should().NotBeNull();
        result!.Name.Should().Be("Get Stop");
    }

    [Fact]
    public async Task UpdateStop_ShouldReturnOk_WhenStopExists()
    {
        // Arrange
        var stop = new Stop
        {
            Name = "Old Name",
            Description = "Desc",
            RoomNr = "3.03" // Removed UniqueId
        };
        DbContext.Stops.Add(stop);
        await DbContext.SaveChangesAsync();

        var updateDto = new StopManagementEndpoints.UpdateStopRequestDto(
            stop.Id,
            "New Name",
            "New Desc",
            "3.03",
            "",
            [],
            [],
            []
        );

        // Act
        var response = await Client.PutAsJsonAsync(BaseUrl, updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbStop = await DbContext.Stops.AsNoTracking().FirstAsync(s => s.Id == stop.Id);
        dbStop.Name.Should().Be("New Name");
    }

    [Fact]
    public async Task UpdateStop_ShouldReturnOk_WhenInfrastructureIsMissing()
    {
        // Arrange
        var stop = new Stop
        {
            Name = "No Infrastructure",
            Description = "Desc",
            RoomNr = "3.04",
            Infrastructure = "Beamer"
        };
        DbContext.Stops.Add(stop);
        await DbContext.SaveChangesAsync();

        var updateDto = new
        {
            stop.Id,
            Name = "No Infrastructure",
            Description = "Desc",
            RoomNr = "3.04",
            DivisionIds = Array.Empty<int>(),
            StudentAssignments = Array.Empty<StudentOfStopDto>(),
            StopManagerAssignments = Array.Empty<string>()
        };

        // Act
        var response = await Client.PutAsJsonAsync(BaseUrl, updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbStop = await DbContext.Stops.AsNoTracking().FirstAsync(s => s.Id == stop.Id);
        dbStop.Infrastructure.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteStop_ShouldReturnOk_WhenStopExists()
    {
        // Arrange
        var stop = new Stop
        {
            Name = "Delete Me",
            Description = "Desc",
            RoomNr = "4.04" // Removed UniqueId
        };
        DbContext.Stops.Add(stop);
        await DbContext.SaveChangesAsync();

        // Act
        var response = await Client.DeleteAsync($"{BaseUrl}/{stop.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbStop = await DbContext.Stops.FirstOrDefaultAsync(s => s.Id == stop.Id);
        dbStop.Should().BeNull();
    }

    [Fact]
    public async Task UpdateStop_ShouldReturnBadRequest_WhenStudentIsApprovedAtAnotherStop()
    {
        // Arrange
        var approvedStop = new Stop { Name = "Approved", Description = "", RoomNr = "E01" };
        var stop = new Stop { Name = "Other", Description = "", RoomNr = "E02" };
        DbContext.Stops.AddRange(approvedStop, stop);
        DbContext.Students.Add(new Student
        {
            EdufsUsername = "taken", FirstName = "T", LastName = "Aken", StudentClass = "5AHIF", Department = "HIF",
            StudentAssignments = [new StudentAssignment { EdufsUsername = "taken", Stop = approvedStop, Status = Status.ACCEPTED }]
        });
        await DbContext.SaveChangesAsync();

        var updateDto = new StopManagementEndpoints.UpdateStopRequestDto(
            stop.Id, "Other", "Desc", "E02", "", [], [new StudentOfStopDto("taken", Status.ACCEPTED)], []);

        // Act
        var response = await Client.PutAsJsonAsync(BaseUrl, updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync()).Should().Contain(StudentFunctions.OneApprovedStopMessage);
        (await DbContext.StudentAssignments.AsNoTracking().CountAsync(sa => sa.StopId == stop.Id)).Should().Be(0);
    }

    [Fact]
    public async Task UpdateStop_ShouldReturnOk_WhenStudentIsOnlyPendingElsewhere()
    {
        // Arrange
        var pendingStop = new Stop { Name = "Pending", Description = "", RoomNr = "E01" };
        var stop = new Stop { Name = "Other", Description = "", RoomNr = "E02" };
        DbContext.Stops.AddRange(pendingStop, stop);
        DbContext.Students.Add(new Student
        {
            EdufsUsername = "requested", FirstName = "R", LastName = "Equested", StudentClass = "5AHIF", Department = "HIF",
            StudentAssignments = [new StudentAssignment { EdufsUsername = "requested", Stop = pendingStop, Status = Status.PENDING }]
        });
        await DbContext.SaveChangesAsync();

        var updateDto = new StopManagementEndpoints.UpdateStopRequestDto(
            stop.Id, "Other", "Desc", "E02", "", [], [new StudentOfStopDto("requested", Status.ACCEPTED)], []);

        // Act
        var response = await Client.PutAsJsonAsync(BaseUrl, updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
