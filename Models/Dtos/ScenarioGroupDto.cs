using Backend.Models.Enums;

namespace Backend.Models.Dtos;

public sealed class ScenarioGroupDto
{
    public required string Key { get; init; }
    public required string Name { get; init; }
    public IReadOnlyList<ScenarioItemDto> Items { get; init; } = [];
}

public sealed class ScenarioItemDto
{
    public required int Id { get; init; }
    public required string Name { get; init; }
    public required string PromptKey { get; init; }
    public required LanguageLevel DifficultyLevel { get; init; }
    public required int OrderIndex { get; init; }
    public bool IsUnlocked { get; init; }
    public bool IsCompleted { get; init; }
}
