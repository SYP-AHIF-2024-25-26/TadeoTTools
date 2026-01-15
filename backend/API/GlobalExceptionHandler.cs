using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace API;

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IProblemDetailsService problemDetailsService) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        logger.LogError(exception, "Exception occurred");

        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Server Error",
            Detail = "An unexpected error occurred",
        };

        switch (exception)
        {
            case ValidationException validationException:
                problemDetails.Status = StatusCodes.Status400BadRequest;
                problemDetails.Title = "Validation Error";
                problemDetails.Detail = validationException.Message;
                break;

            case DbUpdateException dbUpdateException:
                // Check for unique constraint violation or other DB specific errors if needed
                // For now, treat as a conflict or bad request depending on context, 
                // but often unique constraints are 409 Conflict.
                // We can inspect the inner exception for Postgres specific codes if needed (e.g. 23505 for unique violation)

                problemDetails.Status = StatusCodes.Status409Conflict;
                problemDetails.Title = "Database Conflict";
                problemDetails.Detail = "A database error occurred. This might be due to a duplicate entry or invalid data.";

                if (dbUpdateException.InnerException != null)
                {
                    problemDetails.Extensions["innerError"] = dbUpdateException.InnerException.Message;
                }
                break;
        }

        // Set Type and Instance for all problem details
        problemDetails.Type = exception.GetType().Name;
        problemDetails.Instance = $"{httpContext.Request.Method} {httpContext.Request.Path}";


        // Use IProblemDetailsService to write the response
        var problemDetailsContext = new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problemDetails,
            Exception = exception
        };

        await problemDetailsService.TryWriteAsync(problemDetailsContext);

        return true;
    }
}
