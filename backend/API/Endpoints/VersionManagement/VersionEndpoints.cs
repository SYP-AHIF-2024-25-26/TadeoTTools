namespace API.Endpoints.VersionManagement;

public static class VersionEndpoints
{
    public record VersionDto(string Version);

    // APP_VERSION is set in the image by CI; outside Docker there is none.
    public static IResult GetVersion(IConfiguration configuration) =>
        Results.Ok(new VersionDto(configuration["APP_VERSION"] ?? "dev"));
}
