namespace API.Endpoints.RegistrationManagement;

/// <summary>
/// The visitors' photos as <c>Visitor_0001.png</c> files in one folder (<c>Photos:Path</c>, in Docker a
/// bind mount at <c>/app/photos</c>). Served unauthenticated under <c>/v1/visitor-photos/</c>, because
/// the Roboterführerschein stops fetch them by visitor id with the PhotoDownloader.
/// </summary>
public class VisitorPhotoStore
{
    private const string Pattern = "Visitor_*.png";

    public VisitorPhotoStore(string folder)
    {
        Folder = Path.GetFullPath(folder);
        Directory.CreateDirectory(Folder);
    }

    public string Folder { get; }

    public static string FileName(int visitorId) => $"Visitor_{visitorId:D4}.png";

    public Task WriteAsync(int visitorId, byte[] image) =>
        File.WriteAllBytesAsync(Path.Combine(Folder, FileName(visitorId)), image);

    public IEnumerable<string> Files() =>
        Directory.EnumerateFiles(Folder, Pattern).OrderBy(f => f, StringComparer.Ordinal);

    /// <summary>Deletes every photo file and returns how many there were.</summary>
    public int DeleteAll()
    {
        var count = 0;
        foreach (var file in Files().ToList())
        {
            File.Delete(file);
            count++;
        }

        return count;
    }
}
