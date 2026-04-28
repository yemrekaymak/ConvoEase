using Backend.Models.Entities;
using Backend.Models.Enums;

namespace Backend.Services;

internal static class ScenarioUnlockRules
{
    public static IReadOnlyDictionary<int, ScenarioAccessState> Evaluate(
        IEnumerable<Scenario> scenarios,
        LanguageLevel userLevel,
        IReadOnlySet<int> completedScenarioIds)
    {
        var result = new Dictionary<int, ScenarioAccessState>();

        foreach (var group in scenarios
                     .GroupBy(x => x.GroupKey)
                     .OrderBy(x => x.Key))
        {
            var ordered = group
                .OrderBy(x => x.OrderIndex)
                .ThenBy(x => x.Name)
                .ToList();

            for (var index = 0; index < ordered.Count; index++)
            {
                var scenario = ordered[index];
                var isCompleted = completedScenarioIds.Contains(scenario.Id);
                var isUnlocked = IsUnlocked(ordered, index, userLevel, completedScenarioIds);

                result[scenario.Id] = new ScenarioAccessState(isUnlocked, isCompleted);
            }
        }

        return result;
    }

    private static bool IsUnlocked(
        IReadOnlyList<Scenario> groupScenarios,
        int scenarioIndex,
        LanguageLevel userLevel,
        IReadOnlySet<int> completedScenarioIds)
    {
        var scenario = groupScenarios[scenarioIndex];

        if (scenario.DifficultyLevel < userLevel)
        {
            return true;
        }

        if (scenario.DifficultyLevel > userLevel)
        {
            return false;
        }

        var previousSameLevelScenario = groupScenarios
            .Take(scenarioIndex)
            .Where(x => x.DifficultyLevel == scenario.DifficultyLevel)
            .LastOrDefault();

        return previousSameLevelScenario is null || completedScenarioIds.Contains(previousSameLevelScenario.Id);
    }
}

internal readonly record struct ScenarioAccessState(bool IsUnlocked, bool IsCompleted);
