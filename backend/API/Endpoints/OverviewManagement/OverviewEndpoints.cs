using System.Text.RegularExpressions;
using Database.Entities;
using Database.Repository;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.OverviewManagement;

public static partial class OverviewEndpoints
{
    public const string CountdownFlagKey = "showCountdown";

    public static async Task<IResult> GetOverview(TadeoTDbContext context)
    {
        var groups = await context.StopGroups
            .OrderBy(g => g.Order)
            .Select(g => new OverviewGroupDto(
                g.Id,
                g.Name,
                g.IsPublic,
                g.StopAssignments.OrderBy(a => a.Order).Select(a => a.StopId).ToList()))
            .ToListAsync();

        var stops = await context.Stops
            .OrderBy(s => s.Name)
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.RoomNr,
                s.Description,
                DivisionColors = s.Divisions.OrderBy(d => d.Id).Select(d => d.Color).ToList(),
                ManagerCount = s.StopManagerAssignments.Count,
                ApprovedCount = s.StudentAssignments.Count(a => a.Status == Status.ACCEPTED),
                PendingCount = s.StudentAssignments.Count(a => a.Status == Status.PENDING),
            })
            .ToListAsync();

        // Same states as the dashboard's student list: old rejected requests don't count,
        // more than one remaining request is a conflict.
        var studentRequests = await context.Students
            .Select(s => new
            {
                Active = s.StudentAssignments.Count(a => a.Status != Status.DECLINED),
                Approved = s.StudentAssignments.Count(a => a.Status == Status.ACCEPTED),
            })
            .ToListAsync();

        var countdown = await context.FeatureFlags
            .FirstOrDefaultAsync(f => EF.Functions.ILike(f.FeatureKey, CountdownFlagKey));

        var students = new OverviewStudentsDto(
            Total: studentRequests.Count,
            Approved: studentRequests.Count(s => s.Active == 1 && s.Approved == 1),
            Pending: studentRequests.Count(s => s.Active == 1 && s.Approved == 0),
            Conflict: studentRequests.Count(s => s.Active > 1),
            Unassigned: studentRequests.Count(s => s.Active == 0));

        return Results.Ok(new OverviewDto(
            DivisionCount: await context.Divisions.CountAsync(),
            StopManagerCount: await context.StopManagers.CountAsync(),
            Students: students,
            FeedbackSessionCount: await context.FeedbackSessions.CountAsync(),
            LatestFeedbackAt: await context.FeedbackSessions.MaxAsync(f => (DateTime?)f.Timestamp),
            Countdown: new OverviewCountdownDto(countdown?.IsEnabled ?? false, countdown?.Value),
            Groups: groups,
            Stops: stops.Select(s => new OverviewStopDto(
                s.Id,
                s.Name,
                s.RoomNr,
                HasDescription(s.Description),
                s.DivisionColors,
                s.ManagerCount,
                s.ApprovedCount,
                s.PendingCount)).ToList()));
    }

    // Descriptions are HTML from the rich text editor; "<p></p>" counts as empty.
    private static bool HasDescription(string description) =>
        !string.IsNullOrWhiteSpace(HtmlTag().Replace(description, "").Replace("&nbsp;", " "));

    [GeneratedRegex("<[^>]*>")]
    private static partial Regex HtmlTag();

    public record OverviewDto(
        int DivisionCount,
        int StopManagerCount,
        OverviewStudentsDto Students,
        int FeedbackSessionCount,
        DateTime? LatestFeedbackAt,
        OverviewCountdownDto Countdown,
        List<OverviewGroupDto> Groups,
        List<OverviewStopDto> Stops);

    public record OverviewStudentsDto(int Total, int Approved, int Pending, int Conflict, int Unassigned);

    public record OverviewCountdownDto(bool IsEnabled, string? Value);

    /// <summary>A stop group in tour order, with its stop ids in tour order.</summary>
    public record OverviewGroupDto(int Id, string Name, bool IsPublic, List<int> StopIds);

    public record OverviewStopDto(
        int Id,
        string Name,
        string RoomNr,
        bool HasDescription,
        List<string> DivisionColors,
        int ManagerCount,
        int ApprovedStudentCount,
        int PendingStudentCount);
}
