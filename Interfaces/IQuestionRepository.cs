using Backend.Models.Entities;

namespace Backend.Interfaces;

public interface IQuestionRepository
{
    Task<IReadOnlyList<Question>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<bool> AnyAsync(CancellationToken cancellationToken = default);
    Task AddRangeAsync(IEnumerable<Question> questions, CancellationToken cancellationToken = default);
}



