using System.Text.Json;
using Backend.Common;
using FluentValidation;

namespace Backend.Middleware;

public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ValidationException ex)
        {
            await WriteErrorAsync(context, 400, ex.Errors.FirstOrDefault()?.ErrorMessage ?? ex.Message);
        }
        catch (AppException ex)
        {
            await WriteErrorAsync(context, ex.StatusCode, ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            await WriteErrorAsync(context, 500, "An unexpected error occurred.");
        }
    }

    private static async Task WriteErrorAsync(HttpContext context, int statusCode, string message)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var payload = JsonSerializer.Serialize(new
        {
            message,
            statusCode
        });

        await context.Response.WriteAsync(payload);
    }
}



