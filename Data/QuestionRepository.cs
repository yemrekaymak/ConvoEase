using Backend.Models.Entities;
using Backend.Interfaces;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public sealed class QuestionRepository(AppDbContext dbContext) : IQuestionRepository
{
    public async Task<IReadOnlyList<Question>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await dbContext.Questions.OrderBy(x => x.Id).ToListAsync(cancellationToken);

    public Task<bool> AnyAsync(CancellationToken cancellationToken = default) =>
        dbContext.Questions.AnyAsync(cancellationToken);

    public Task AddRangeAsync(IEnumerable<Question> questions, CancellationToken cancellationToken = default) =>
        dbContext.Questions.AddRangeAsync(questions, cancellationToken);
}



