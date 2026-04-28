using Backend.Interfaces;
using Backend.Models.Entities;
using Backend.Models.Enums;
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
        var expectedScenarios = BuildScenarioSeeds();

        var existingScenarios = await dbContext.Scenarios.ToListAsync(cancellationToken);
        var referencedScenarioIds = await dbContext.UserSessions
            .Select(x => x.ScenarioId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var matchedExistingIds = new HashSet<int>();

        foreach (var expectedScenario in expectedScenarios)
        {
            var existingScenario = existingScenarios.FirstOrDefault(x =>
                (!string.IsNullOrWhiteSpace(x.PromptKey) &&
                 string.Equals(x.GroupKey, expectedScenario.GroupKey, StringComparison.OrdinalIgnoreCase) &&
                 x.OrderIndex == expectedScenario.OrderIndex) ||
                (expectedScenario.LegacyName is not null &&
                 string.Equals(x.Name, expectedScenario.LegacyName, StringComparison.OrdinalIgnoreCase)));

            if (existingScenario is null)
            {
                await scenarioRepository.AddRangeAsync(
                [
                    new Scenario
                    {
                        GroupKey = expectedScenario.GroupKey,
                        GroupName = expectedScenario.GroupName,
                        Name = expectedScenario.Name,
                        PromptKey = expectedScenario.PromptKey,
                        DifficultyLevel = expectedScenario.DifficultyLevel,
                        OrderIndex = expectedScenario.OrderIndex
                    }
                ], cancellationToken);
                continue;
            }

            matchedExistingIds.Add(existingScenario.Id);
            existingScenario.GroupKey = expectedScenario.GroupKey;
            existingScenario.GroupName = expectedScenario.GroupName;
            existingScenario.Name = expectedScenario.Name;
            existingScenario.PromptKey = expectedScenario.PromptKey;
            existingScenario.DifficultyLevel = expectedScenario.DifficultyLevel;
            existingScenario.OrderIndex = expectedScenario.OrderIndex;
        }

        foreach (var existingScenario in existingScenarios.Where(x =>
                     !matchedExistingIds.Contains(x.Id) &&
                     !referencedScenarioIds.Contains(x.Id)))
        {
            dbContext.Scenarios.Remove(existingScenario);
        }
    }

    private static IReadOnlyList<ScenarioSeed> BuildScenarioSeeds()
    {
        return
        [
            .. BuildGroup("cafe", "Cafe", "kafe", "Cafe Conversation"),
            .. BuildGroup("hospital", "Hospital", "hastane", "Hospital Visit"),
            .. BuildGroup("hotel", "Hotel", "otel", "Hotel Check-in"),
            .. BuildGroup("interview", "Job", "is_gorusmesi", "Job Interview"),
            .. BuildGroup("shopping", "Shopping", "alisveris", "Shopping")
        ];
    }

    private static IEnumerable<ScenarioSeed> BuildGroup(
        string groupKey,
        string groupName,
        string promptKey,
        string legacyName)
    {
        var orderIndex = 1;

        for (var i = 1; i <= 5; i++, orderIndex++)
        {
            yield return new ScenarioSeed(
                groupKey,
                groupName,
                $"{groupName} {i}",
                promptKey,
                LanguageLevel.Beginner,
                orderIndex,
                i == 1 ? legacyName : null);
        }

        for (var i = 1; i <= 5; i++, orderIndex++)
        {
            yield return new ScenarioSeed(
                groupKey,
                groupName,
                $"{groupName} {i}",
                promptKey,
                LanguageLevel.Intermediate,
                orderIndex);
        }

        for (var i = 1; i <= 5; i++, orderIndex++)
        {
            yield return new ScenarioSeed(
                groupKey,
                groupName,
                $"{groupName} {i}",
                promptKey,
                LanguageLevel.Advanced,
                orderIndex);
        }
    }

    private sealed record ScenarioSeed(
        string GroupKey,
        string GroupName,
        string Name,
        string PromptKey,
        LanguageLevel DifficultyLevel,
        int OrderIndex,
        string? LegacyName = null);
}
