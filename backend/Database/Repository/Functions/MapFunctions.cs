using System.Text.RegularExpressions;
using Database.Entities;

namespace Database.Repository.Functions;

public static partial class MapFunctions
{
    public static readonly string[] Floors = ["U", "E", "1"];
    public static readonly string[] Icons = ["buffet", "wc", "info"];

    /// <summary>A room number with its optional part: "E58-1", "E58/1", "U04a", "101".</summary>
    [GeneratedRegex(@"(?<![A-Za-z0-9])([UEK]\d{2}|1\d{2})(?:[-/](\d)(?!\d))?(?!\d)", RegexOptions.IgnoreCase)]
    private static partial Regex RoomCodeRegex();

    /// <summary>"vor 104" names a spot near a room, not the room.</summary>
    [GeneratedRegex(@"\b(vor|neben|bis)\b", RegexOptions.IgnoreCase)]
    private static partial Regex NearRoomRegex();

    /// <summary>
    /// The places a stop's room text points to: the whole text as a place ("Aula UG", "Gang bis 143"),
    /// otherwise every room number in it. "E25/E22/E23" gives three, "U04a" gives U04.
    /// </summary>
    public static List<MapPlace> MatchRoomText(string roomText, IReadOnlyCollection<MapPlace> places)
    {
        var text = roomText.Trim();
        var whole = places.FirstOrDefault(p =>
            string.Equals(p.Code, text, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(p.Name, text, StringComparison.OrdinalIgnoreCase));
        if (whole is not null)
        {
            return [whole];
        }

        if (NearRoomRegex().IsMatch(text))
        {
            return [];
        }

        var byCode = new Dictionary<string, MapPlace>(StringComparer.OrdinalIgnoreCase);
        foreach (var place in places)
        {
            // "E54+53" is one room on the plan for E54 and E53.
            var parts = place.Code.Split('+');
            byCode.TryAdd(parts[0], place);
            foreach (var part in parts.Skip(1))
            {
                byCode.TryAdd(parts[0][..^part.Length] + part, place);
            }
        }

        return RoomCodeRegex().Matches(text)
            .Select(match =>
            {
                var room = match.Groups[1].Value;
                return match.Groups[2].Success && byCode.TryGetValue($"{room}-{match.Groups[2].Value}", out var part)
                    ? part
                    : byCode.GetValueOrDefault(room);
            })
            .OfType<MapPlace>()
            .Distinct()
            .ToList();
    }
}
