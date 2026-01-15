using System.Net;
using System.Net.Http.Json;
using API.Endpoints.StudentManagement;
using Database.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace TadeoTIntegrationTests;

public class StudentTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private const string BaseUrl = "/v1/api/students";

    [Fact]
    public async Task GetAllStudents_ShouldReturnEmptyList_WhenNoStudentsExist()
    {
        // Act
        var response = await Client.GetFromJsonAsync<List<Student>>(BaseUrl);

        // Assert
        response.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateStudent_ShouldReturnOk_WhenStudentIsValid()
    {
        // Arrange
        var studentDto = new StudentManagementEndpoints.StudentNoAssignmentsDto(
            "testuser", "Test", "User", "5AHIF", "HIF");

        // Act
        var response = await Client.PostAsJsonAsync(BaseUrl, studentDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbStudent = await DbContext.Students.FirstOrDefaultAsync(s => s.EdufsUsername == "testuser");
        dbStudent.Should().NotBeNull();
        dbStudent!.FirstName.Should().Be("Test");
    }

    [Fact]
    public async Task CreateStudent_ShouldReturnConflict_WhenStudentAlreadyExists()
    {
        // Arrange
        var studentDto = new StudentManagementEndpoints.StudentNoAssignmentsDto(
            "duplicate", "Dup", "Lic", "5AHIF", "HIF");
        await Client.PostAsJsonAsync(BaseUrl, studentDto);

        // Act
        var response = await Client.PostAsJsonAsync(BaseUrl, studentDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CreateStudent_ShouldReturnBadRequest_WhenRequiredFieldsAreMissing()
    {
        // Arrange
        var invalidStudent = new
        {
            // EdufsUsername missing
            FirstName = "Test",
            LastName = "User",
            StudentClass = "5AHIF",
            Department = "HIF"
        };

        // Act
        var response = await Client.PostAsJsonAsync(BaseUrl, invalidStudent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateStudent_ShouldReturnOk_WhenStudentExists()
    {
        // Arrange
        var student = new Student
        {
            EdufsUsername = "updateuser",
            FirstName = "Old",
            LastName = "Name",
            StudentClass = "1AHIF",
            Department = "HIF",
            StudentAssignments = []
        };
        DbContext.Students.Add(student);
        await DbContext.SaveChangesAsync();

        var updateDto = new
        {
            EdufsUsername = "updateuser",
            FirstName = "New",
            LastName = "Name",
            StudentClass = "2AHIF",
            Department = "HIF",
            StudentAssignments = new List<object>()
        };

        // Act
        var response = await Client.PutAsJsonAsync($"{BaseUrl}/updateuser", updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dbStudent = await DbContext.Students.AsNoTracking().FirstAsync(s => s.EdufsUsername == "updateuser");
        dbStudent.FirstName.Should().Be("New");
        dbStudent.StudentClass.Should().Be("2AHIF");
    }

    [Fact]
    public async Task UpdateStudent_ShouldReturnNotFound_WhenStudentDoesNotExist()
    {
        // Arrange
        var updateDto = new
        {
            EdufsUsername = "nonexistent",
            FirstName = "New",
            LastName = "Name",
            StudentClass = "2AHIF",
            Department = "HIF",
            StudentAssignments = new List<object>()
        };

        // Act
        var response = await Client.PutAsJsonAsync($"{BaseUrl}/nonexistent", updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
