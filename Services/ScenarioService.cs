using Backend.Common;
using Backend.Models.Dtos;
using Backend.Interfaces;

namespace Backend.Services;

public sealed class ScenarioService(IUserRepository userRepository, IScenarioRepository scenarioRepository) : IScenarioService
{
    public async Task<IReadOnlyList<ScenarioDto>> GetAllowedScenariosAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        if (user.CurrentLevel is null)
        {
            return [];
        }

        var scenarios = await scenarioRepository.GetAllowedAsync(user.CurrentLevel.Value, cancellationToken);
        return scenarios.Select(s => new ScenarioDto
        {
            Id = s.Id,
            Name = s.Name,
            DifficultyLevel = s.DifficultyLevel
        }).ToList();
    }
}



