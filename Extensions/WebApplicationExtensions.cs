using Backend.Middleware;

namespace Backend.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication UseApiInfrastructure(this WebApplication app)
    {
        app.UseMiddleware<ExceptionHandlingMiddleware>();
        app.UseAuthentication();
        app.UseAuthorization();

        return app;
    }
}



