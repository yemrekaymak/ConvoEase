using Backend.Models.Enums;

namespace Backend.Models.Dtos;

public sealed class SessionReportDto
{
    public required Guid SessionId { get; init; }
    public required int ScenarioId { get; init; }
    public required string ScenarioName { get; init; }
    public required InteractionType InteractionType { get; init; }
    public decimal? Score { get; init; }
    public string? SummaryReport { get; init; }
    public required bool IsCompleted { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
    public IReadOnlyList<MistakeDto> Mistakes { get; init; } = [];
}
