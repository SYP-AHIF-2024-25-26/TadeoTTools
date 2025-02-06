using System.Security.Cryptography;
using System.Text;

namespace Database.Repository;

public static class ApiKeyGenerator
{
    public static string GenerateApiKey(int length = 32)
    {
        var apiKeyBytes = new byte[length];
        RandomNumberGenerator.Fill(apiKeyBytes);

        StringBuilder apiKey = new(length * 2);
        foreach (var b in apiKeyBytes)
        {
            apiKey.Append(b.ToString("x2"));
        }
        return apiKey.ToString();
    }
}
