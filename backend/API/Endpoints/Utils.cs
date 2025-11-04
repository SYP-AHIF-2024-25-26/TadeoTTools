using System.Text;

namespace API.Endpoints;

public static class Utils
{
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
}