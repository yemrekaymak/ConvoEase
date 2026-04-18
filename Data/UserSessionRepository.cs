using Backend.Models.Entities;
using Backend.Models.Enums;
using Backend.Interfaces;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public sealed class UserSessionRepository(AppDbContext dbContext) : IUserSessionRepository
{
    public Task AddAsync(UserSession session, CancellationToken cancellationToken = default) =>
        dbContext.UserSessions.AddAsync(session, cancellationToken).AsTask();

    public Task<UserSession?> GetByIdForUserAsync(Guid sessionId, Guid userId, CancellationToken cancellationToken = default) =>
        dbContext.UserSessions
            .Include(x => x.Scenario)
            .FirstOrDefaultAsync(x => x.Id == sessionId && x.UserId == userId, cancellationToken);

    public async Task<bool> HasCompletedAllScenariosForLevelAsync(Guid userId, LanguageLevel level, IEnumerable<int> scenarioIds, CancellationToken cancellationToken = default)
    {
        var completedScenarioIds = await dbContext.UserSessions
            .Where(x => x.UserId == userId && x.IsCompleted && scenarioIds.Contains(x.ScenarioId))
            .Select(x => x.ScenarioId)
            .Distinct()
            .ToListAsync(cancellationToken);

        return scenarioIds.All(completedScenarioIds.Contains);
    }
}



