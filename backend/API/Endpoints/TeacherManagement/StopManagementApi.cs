using Database.Repository.Functions;

namespace API.Endpoints.TeacherManagement;

public static class StopManagementApi
{
    public static void MapTeacherEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");
        group.MapGet("api/teachers", TeacherManagementEndpoints.GetAllTeachers)
            .WithName(nameof(TeacherManagementEndpoints.GetAllTeachers))
            .WithDescription("Get all teachers")
            .Produces<List<TeacherFunctions.TeacherWithoutStopsDto>>();
    }
}