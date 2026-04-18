using Backend.Models.Entities;
using Backend.Interfaces;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public sealed class UserMistakeRepository(AppDbContext dbContext) : IUserMistakeRepository
{
    public Task AddRangeAsync(IEnumerable<UserMistake> mistakes, CancellationToken cancellationToken = default) =>
        dbContext.UserMistakes.AddRangeAsync(mistakes, cancellationToken);

    public async Task<(IReadOnlyList<UserMistake> Items, int TotalCount)> GetPagedForUserAsync(Guid userId, int? scenarioId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = dbContext.UserMistakes
            .AsNoTracking()
            .Include(x => x.Session)
            .ThenInclude(x => x.Scenario)
            .Where(x => x.Session.UserId == userId);

        if (scenarioId.HasValue)
        {
            query = query.Where(x => x.Session.ScenarioId == scenarioId.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.Session.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }
}



