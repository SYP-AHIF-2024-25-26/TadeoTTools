using System.Text;

namespace API.Endpoints;

public static class Utils
{
    /// <summary>Largest csv file an import accepts.</summary>
    public const int MaxCsvImportBytes = 1024 * 1024;

    public static string EscapeCsvField(string field)
    {
        if (string.IsNullOrEmpty(field))
            return "";

        // If the field contains commas, quotes, or newlines, wrap it in quotes and double any quotes
        if (field.Contains(";") || field.Contains("\"") || field.Contains("\n"))
        {
            return $"\"{field.Replace("\"", "\"\"")}\"";
        }

        return field;
    }

    // Returns bytes encoded as UTF-8 with a BOM (UTF8-BOM)
    public static byte[] ToUtf8Bom(string content)
    {
        var bom = Encoding.UTF8.GetPreamble(); // EF BB BF
        var body = Encoding.UTF8.GetBytes(content);
        var bytes = new byte[bom.Length + body.Length];
        Buffer.BlockCopy(bom, 0, bytes, 0, bom.Length);
        Buffer.BlockCopy(body, 0, bytes, bom.Length, body.Length);
        return bytes;
    }

    /// <summary>A data row of an imported csv file; <see cref="Line"/> counts the header as line 1.</summary>
    public record CsvRow(int Line, string[] Fields);

    public record CsvImportResultDto(int Imported);

    /// <summary>Why a csv file was not imported; nothing of it was stored.</summary>
    public record CsvImportErrorsDto(List<string> Errors);

    /// <summary>At most this many errors are reported for one file.</summary>
    public const int MaxCsvErrors = 20;

    /// <summary>400 with the first <see cref="MaxCsvErrors"/> errors.</summary>
    public static IResult CsvErrors(List<string> errors) =>
        Results.BadRequest(new CsvImportErrorsDto(errors.Take(MaxCsvErrors).ToList()));

    /// <summary>
    /// Reads a csv file sent as the request body, in the format of the exports (<c>;</c>, fields
    /// quoted as <see cref="EscapeCsvField"/> writes them). UTF-8 with or without BOM; a file Excel
    /// saved as ANSI is read as Latin-1, so umlauts survive. Empty lines are skipped.
    /// Returns null when the body is larger than <see cref="MaxCsvImportBytes"/>.
    /// </summary>
    public static async Task<(string[] Header, List<CsvRow> Rows)?> ReadCsvAsync(HttpRequest request)
    {
        using var buffer = new MemoryStream();
        await request.Body.CopyToAsync(buffer);
        if (buffer.Length > MaxCsvImportBytes)
            return null;

        var bytes = buffer.ToArray();
        var preamble = Encoding.UTF8.GetPreamble();
        var offset = bytes.AsSpan().StartsWith(preamble) ? preamble.Length : 0;
        string text;
        try
        {
            text = new UTF8Encoding(false, throwOnInvalidBytes: true).GetString(bytes, offset, bytes.Length - offset);
        }
        catch (DecoderFallbackException)
        {
            text = Encoding.Latin1.GetString(bytes);
        }

        var lines = ParseCsv(text);
        if (lines.Count == 0)
            return ([], []);

        var header = lines[0].Fields.Select(f => f.Trim()).ToArray();
        return (header, lines.Skip(1).Where(l => l.Fields.Any(f => f.Trim() != "")).ToList());
    }

    /// <summary>True when the header has exactly these columns, ignoring case.</summary>
    public static bool HasColumns(string[] header, params string[] columns) =>
        header.Length == columns.Length &&
        header.Zip(columns).All(p => string.Equals(p.First, p.Second, StringComparison.OrdinalIgnoreCase));

    private static List<CsvRow> ParseCsv(string text)
    {
        var rows = new List<CsvRow>();
        var fields = new List<string>();
        var field = new StringBuilder();
        var inQuotes = false;
        var line = 1;
        var rowLine = 1;

        void EndRow()
        {
            fields.Add(field.ToString());
            field.Clear();
            rows.Add(new CsvRow(rowLine, fields.ToArray()));
            fields.Clear();
        }

        for (var i = 0; i < text.Length; i++)
        {
            var c = text[i];
            if (inQuotes)
            {
                if (c == '"' && i + 1 < text.Length && text[i + 1] == '"')
                {
                    field.Append('"');
                    i++;
                }
                else if (c == '"')
                {
                    inQuotes = false;
                }
                else
                {
                    if (c == '\n') line++;
                    field.Append(c);
                }
            }
            else if (c == '"' && field.Length == 0)
            {
                inQuotes = true;
            }
            else if (c == ';')
            {
                fields.Add(field.ToString());
                field.Clear();
            }
            else if (c == '\n')
            {
                EndRow();
                line++;
                rowLine = line;
            }
            else if (c != '\r')
            {
                field.Append(c);
            }
        }

        if (field.Length > 0 || fields.Count > 0)
            EndRow();

        return rows;
    }
}
