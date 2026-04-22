using Backend.Models.Entities;
using Backend.Models.Enums;
using Backend.Interfaces;
using Backend.Data;
using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;

namespace Backend.Data;

public sealed class UserSessionRepository(AppDbContext dbContext) : IUserSessionRepository
{
    public Task AddAsync(UserSession session, CancellationToken cancellationToken = default) =>
        dbContext.UserSessions.AddAsync(session, cancellationToken).AsTask();

    public Task<UserSession?> GetByIdForUserAsync(Guid sessionId, Guid userId, CancellationToken cancellationToken = default) =>
        dbContext.UserSessions
            .Include(x => x.Scenario)
            .Include(x => x.Mistakes)
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

    public async Task EnsureSchemaAsync(CancellationToken cancellationToken = default)
    {
        if (!dbContext.Database.IsSqlite())
        {
            return;
        }

        var connection = dbContext.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;
        if (shouldClose)
        {
            await connection.OpenAsync(cancellationToken);
        }

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT COUNT(*) FROM pragma_table_info('UserSessions') WHERE name = 'SummaryReport';";

            var result = await command.ExecuteScalarAsync(cancellationToken);
            if (result is long columnCount && columnCount > 0)
            {
                return;
            }
        }
        finally
        {
            if (shouldClose)
            {
                await connection.CloseAsync();
            }
        }

        await dbContext.Database.ExecuteSqlRawAsync(
            """
            ALTER TABLE UserSessions
            ADD COLUMN SummaryReport TEXT NULL;
            """,
            cancellationToken);
    }
}



