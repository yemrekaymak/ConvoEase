using Backend.Models.Entities;
using Backend.Models.Enums;

namespace Backend.Interfaces;

public interface IScenarioRepository
{
    Task<IReadOnlyList<Scenario>> GetAllowedAsync(LanguageLevel level, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Scenario>> GetByLevelAsync(LanguageLevel level, CancellationToken cancellationToken = default);
    Task<Scenario?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> AnyAsync(CancellationToken cancellationToken = default);
    Task AddRangeAsync(IEnumerable<Scenario> scenarios, CancellationToken cancellationToken = default);
}



