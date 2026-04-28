using Backend.Common;
using Backend.Interfaces;
using Backend.Models.Dtos;

namespace Backend.Services;

public sealed class ScenarioService(
    IUserRepository userRepository,
    IScenarioRepository scenarioRepository,
    IUserSessionRepository userSessionRepository) : IScenarioService
{
    public async Task<IReadOnlyList<ScenarioGroupDto>> GetCatalogAsync(CancellationToken cancellationToken = default)
    {
        var scenarios = await scenarioRepository.GetAllAsync(cancellationToken);
        return MapGroups(scenarios, null);
    }

    public async Task<IReadOnlyList<ScenarioGroupDto>> GetBrowseAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var scenarios = await scenarioRepository.GetAllAsync(cancellationToken);
        if (user.CurrentLevel is null)
        {
            return MapGroups(scenarios, null);
        }

        var completedScenarioIds = await userSessionRepository.GetCompletedScenarioIdsAsync(userId, cancellationToken);
        var accessMap = ScenarioUnlockRules.Evaluate(scenarios, user.CurrentLevel.Value, completedScenarioIds);
        return MapGroups(scenarios, accessMap);
    }

    public async Task<IReadOnlyList<ScenarioDto>> GetAllowedScenariosAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        if (user.CurrentLevel is null)
        {
            return [];
        }

        var scenarios = await scenarioRepository.GetAllAsync(cancellationToken);
        var completedScenarioIds = await userSessionRepository.GetCompletedScenarioIdsAsync(userId, cancellationToken);
        var accessMap = ScenarioUnlockRules.Evaluate(scenarios, user.CurrentLevel.Value, completedScenarioIds);

        return scenarios
            .Where(x => accessMap.TryGetValue(x.Id, out var access) && access.IsUnlocked)
            .Select(x => new ScenarioDto
            {
                Id = x.Id,
                GroupKey = x.GroupKey,
                GroupName = x.GroupName,
                Name = x.Name,
                PromptKey = x.PromptKey,
                DifficultyLevel = x.DifficultyLevel,
                OrderIndex = x.OrderIndex,
                IsUnlocked = true,
                IsCompleted = accessMap[x.Id].IsCompleted
            })
            .ToList();
    }

    private static IReadOnlyList<ScenarioGroupDto> MapGroups(
        IReadOnlyList<Backend.Models.Entities.Scenario> scenarios,
        IReadOnlyDictionary<int, ScenarioAccessState>? accessMap)
    {
        return scenarios
            .GroupBy(x => new { x.GroupKey, x.GroupName })
            .OrderBy(x => x.Key.GroupName)
            .Select(group => new ScenarioGroupDto
            {
                Key = group.Key.GroupKey,
                Name = group.Key.GroupName,
                Items = group
                    .OrderBy(x => x.OrderIndex)
                    .ThenBy(x => x.Name)
                    .Select(x => new ScenarioItemDto
                    {
                        Id = x.Id,
                        Name = x.Name,
                        PromptKey = x.PromptKey,
                        DifficultyLevel = x.DifficultyLevel,
                        OrderIndex = x.OrderIndex,
                        IsUnlocked = accessMap?.TryGetValue(x.Id, out var access) == true && access.IsUnlocked,
                        IsCompleted = accessMap?.TryGetValue(x.Id, out access) == true && access.IsCompleted
                    })
                    .ToList()
            })
            .ToList();
    }
}
