using Backend.Models.Dtos;

namespace Backend.Interfaces;

public interface IScenarioService
{
    Task<IReadOnlyList<ScenarioGroupDto>> GetCatalogAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ScenarioGroupDto>> GetBrowseAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ScenarioDto>> GetAllowedScenariosAsync(Guid userId, CancellationToken cancellationToken = default);
}



