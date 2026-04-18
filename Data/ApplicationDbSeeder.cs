using Backend.Models.Entities;
using Backend.Models.Enums;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public sealed class ApplicationDbSeeder(
    IQuestionRepository questionRepository,
    IScenarioRepository scenarioRepository,
    IUnitOfWork unitOfWork,
    AppDbContext dbContext)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        if (!await questionRepository.AnyAsync(cancellationToken))
        {
            await questionRepository.AddRangeAsync(
            [
                new Question { Text = "Tell me about yourself." },
                new Question { Text = "Why do you want to improve your English?" },
                new Question { Text = "Describe your daily routine." },
                new Question { Text = "What do you usually do on weekends?" },
                new Question { Text = "Describe a memorable trip you had." }
            ], cancellationToken);
        }

        await SyncScenariosAsync(cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task SyncScenariosAsync(CancellationToken cancellationToken)
    {
        var expectedScenarios = new[]
        {
            new ScenarioSeed("Cafe Conversation", LanguageLevel.Beginner),
            new ScenarioSeed("Hospital Visit", LanguageLevel.Intermediate),
            new ScenarioSeed("Shopping", LanguageLevel.Beginner),
            new ScenarioSeed("Hotel Check-in", LanguageLevel.Intermediate),
            new ScenarioSeed("Job Interview", LanguageLevel.Advanced)
        };

        var existingScenarios = await dbContext.Scenarios.ToListAsync(cancellationToken);

        foreach (var existingScenario in existingScenarios)
        {
            if (expectedScenarios.All(x => !string.Equals(x.Name, existingScenario.Name, StringComparison.OrdinalIgnoreCase)))
            {
                dbContext.Scenarios.Remove(existingScenario);
            }
        }

        foreach (var expectedScenario in expectedScenarios)
        {
            var existingScenario = existingScenarios.FirstOrDefault(x =>
                string.Equals(x.Name, expectedScenario.Name, StringComparison.OrdinalIgnoreCase));

            if (existingScenario is null)
            {
                await scenarioRepository.AddRangeAsync(
                [
                    new Scenario
                    {
                        Name = expectedScenario.Name,
                        DifficultyLevel = expectedScenario.DifficultyLevel
                    }
                ], cancellationToken);
                continue;
            }

            existingScenario.DifficultyLevel = expectedScenario.DifficultyLevel;
        }
    }

    private sealed record ScenarioSeed(string Name, LanguageLevel DifficultyLevel);
}



