using Backend.Models.Entities;
using Backend.Models.Enums;

namespace Backend.Interfaces;

public interface IUserSessionRepository
{
    Task AddAsync(UserSession session, CancellationToken cancellationToken = default);
    Task<UserSession?> GetByIdForUserAsync(Guid sessionId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> HasCompletedAllScenariosForLevelAsync(Guid userId, LanguageLevel level, IEnumerable<int> scenarioIds, CancellationToken cancellationToken = default);
}



