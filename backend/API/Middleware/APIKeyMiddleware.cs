using System.Security.Cryptography;
using System.Text;
using Database.Repository.Functions;

namespace API.Middleware;

public class ApiKeyMiddleware(RequestDelegate next)
{
    private const string ApiKeyHeaderName = "X-Api-Key";
    private ApiKeyFunctions apiKeyRepository;

    public async Task InvokeAsync(HttpContext context)
    {
        apiKeyRepository = context.RequestServices.GetRequiredService<ApiKeyFunctions>();
        if (context.Request.Method == HttpMethods.Options)
        {
            context.Response.StatusCode = StatusCodes.Status204NoContent;
            return;
        }
        // Only apply to api routes
        if (context.Request.Path.ToString().Contains("api"))
        {
            if (!context.Request.Headers.TryGetValue(ApiKeyHeaderName, out var extractedApiKey))
            {
                context.Response.StatusCode = 401; // Unauthorized
                await context.Response.WriteAsync("API Key was not provided.");
                return;
            }

            if (!await IsValidApiKey(extractedApiKey!))
            {
                context.Response.StatusCode = 403; // Forbidden
                await context.Response.WriteAsync("Invalid API Key.");
                return;
            }
        }

        await next(context);
    }

    private async Task<bool> IsValidApiKey(string userApiKey)
    {
        // Fetch and store system API keys in a HashSet for faster lookups
        var systemApiKeys = (await apiKeyRepository.GetAllApiKeys())
            .Select(ak => ak.APIKeyValue)
            .ToHashSet();

        // Compare using FixedTimeEquals for security
        var userApiKeyBytes = Encoding.UTF8.GetBytes(userApiKey);

        return systemApiKeys
            .Select(systemApiKey => Encoding.UTF8.GetBytes(systemApiKey))
            .Any(systemApiKeyBytes => CryptographicOperations.FixedTimeEquals(userApiKeyBytes, systemApiKeyBytes));
    }
}