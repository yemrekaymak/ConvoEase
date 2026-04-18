using Backend.Models.Dtos;

namespace Backend.Interfaces;

public interface IScenarioService
{
    Task<IReadOnlyList<ScenarioDto>> GetAllowedScenariosAsync(Guid userId, CancellationToken cancellationToken = default);
}



