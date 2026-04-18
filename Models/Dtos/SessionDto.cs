using Backend.Models.Enums;

namespace Backend.Models.Dtos;

public sealed class SessionDto
{
    public required Guid Id { get; init; }
    public required int ScenarioId { get; init; }
    public required InteractionType InteractionType { get; init; }
    public decimal? Score { get; init; }
    public required bool IsCompleted { get; init; }
    public string? LastProgressJson { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
}



