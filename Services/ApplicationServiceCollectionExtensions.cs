using Backend.Interfaces;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Services;

public static class ApplicationServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(ApplicationServiceCollectionExtensions).Assembly);

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IQuestionService, QuestionService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IScenarioService, ScenarioService>();
        services.AddScoped<ISessionService, SessionService>();
        services.AddScoped<IMistakeService, MistakeService>();

        return services;
    }
}



