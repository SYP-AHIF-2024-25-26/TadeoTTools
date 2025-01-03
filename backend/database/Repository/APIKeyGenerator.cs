using System.Security.Cryptography;
using System.Text;

namespace Database.Repository;

public static class APIKeyGenerator
{
    public static string GenerateApiKey(int length = 32)
    {
        byte[] apiKeyBytes = new byte[length];
        RandomNumberGenerator.Fill(apiKeyBytes);

        StringBuilder apiKey = new(length * 2);
        foreach (byte b in apiKeyBytes)
        {
            apiKey.Append(b.ToString("x2"));
        }
        return apiKey.ToString();
    }
}
