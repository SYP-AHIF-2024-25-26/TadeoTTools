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
}