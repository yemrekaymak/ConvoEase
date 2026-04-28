using Backend.Models.Entities;
using Backend.Models.Enums;
using Backend.Interfaces;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public sealed class ScenarioRepository(AppDbContext dbContext) : IScenarioRepository
{
    public async Task<IReadOnlyList<Scenario>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await dbContext.Scenarios
            .OrderBy(x => x.GroupName)
            .ThenBy(x => x.OrderIndex)
            .ThenBy(x => x.Name)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Scenario>> GetAllowedAsync(LanguageLevel level, CancellationToken cancellationToken = default) =>
        await dbContext.Scenarios
            .Where(x => x.DifficultyLevel <= level)
            .OrderBy(x => x.GroupName)
            .ThenBy(x => x.OrderIndex)
            .ThenBy(x => x.Name)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Scenario>> GetByLevelAsync(LanguageLevel level, CancellationToken cancellationToken = default) =>
        await dbContext.Scenarios
            .Where(x => x.DifficultyLevel == level)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

    public Task<Scenario?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        dbContext.Scenarios.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> AnyAsync(CancellationToken cancellationToken = default) =>
        dbContext.Scenarios.AnyAsync(cancellationToken);

    public Task AddRangeAsync(IEnumerable<Scenario> scenarios, CancellationToken cancellationToken = default) =>
        dbContext.Scenarios.AddRangeAsync(scenarios, cancellationToken);
}



