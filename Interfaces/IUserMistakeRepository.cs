using Backend.Models.Entities;

namespace Backend.Interfaces;

public interface IUserMistakeRepository
{
    Task AddRangeAsync(IEnumerable<UserMistake> mistakes, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<UserMistake> Items, int TotalCount)> GetPagedForUserAsync(Guid userId, int? scenarioId, int page, int pageSize, CancellationToken cancellationToken = default);
}



