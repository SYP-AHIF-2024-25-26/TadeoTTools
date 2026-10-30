// Downloads the visitors' photos for the Roboterführerschein into the folder "images" next to
// the program. Photos already there are skipped, so the stops can run it again and again.
//
//   PhotoDownloader.exe                      production backend
//   PhotoDownloader.exe <backend url>        e.g. https://vm45.htl-leonding.ac.at/tadeot-backend-201126
//
// The list and the files are public (no login), as with the legacy backend.

using System.Net.Http.Json;
using System.Text.Json.Serialization;

const string DefaultBaseUrl = "https://tadeot.htl-leonding.ac.at/tadeot-backend-201126";
const string LocalFolderName = "images";

var baseUrl = (args.FirstOrDefault() ?? Environment.GetEnvironmentVariable("TADEOT_BACKEND_URL") ?? DefaultBaseUrl)
    .TrimEnd('/');
var listUrl = $"{baseUrl}/v1/visitor-photos";

using HttpClient client = new()
{
    DefaultRequestHeaders = { { "User-Agent", "PhotoDownloader" } },
    Timeout = TimeSpan.FromSeconds(30),
};

try
{
    var fileNames = await client.GetFromJsonAsync(listUrl, PhotoListJson.Default.StringArray) ?? [];
    Console.WriteLine($"Found {fileNames.Length} photos at {baseUrl}.");
    Directory.CreateDirectory(LocalFolderName);

    var downloaded = 0;
    foreach (var fileName in fileNames)
    {
        // Only plain file names from the server; nothing may land outside the folder.
        if (fileName != Path.GetFileName(fileName))
        {
            continue;
        }

        var localPath = Path.Combine(LocalFolderName, fileName);
        if (File.Exists(localPath))
        {
            continue;
        }

        try
        {
            var bytes = await client.GetByteArrayAsync($"{listUrl}/{Uri.EscapeDataString(fileName)}");
            await File.WriteAllBytesAsync(localPath, bytes);
            downloaded++;
            Console.WriteLine($"Downloaded {fileName}");
        }
        catch (Exception e) when (e is HttpRequestException or TaskCanceledException or IOException)
        {
            Console.WriteLine($"Couldn't download {fileName}: {e.Message}");
        }
    }

    Console.WriteLine($"Download finished: {downloaded} new, {fileNames.Length - downloaded} already there or failed.");
}
catch (Exception e) when (e is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException)
{
    Console.WriteLine($"Error loading the photo list from {listUrl}:");
    Console.WriteLine(e.Message);
}

if (!Console.IsInputRedirected)
{
    Console.WriteLine("Press any key to exit.");
    Console.ReadKey();
}

/// <summary>Generated serializer for the photo list, so the trimmed single-file .exe keeps it.</summary>
[JsonSerializable(typeof(string[]))]
internal partial class PhotoListJson : JsonSerializerContext;
