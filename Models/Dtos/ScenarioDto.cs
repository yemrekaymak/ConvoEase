using Backend.Models.Enums;

namespace Backend.Models.Dtos;

public sealed class ScenarioDto
{
    public required int Id { get; init; }
    public required string Name { get; init; }
    public required LanguageLevel DifficultyLevel { get; init; }
}



