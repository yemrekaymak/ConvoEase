namespace Backend.Models.Dtos;

public sealed class MistakeDto
{
    public required Guid Id { get; init; }
    public required Guid SessionId { get; init; }
    public required int ScenarioId { get; init; }
    public required string ScenarioName { get; init; }
    public required string ErrorType { get; init; }
    public required string WrongSentence { get; init; }
    public required string CorrectionText { get; init; }
    public string? WhyWrong { get; init; }
    public string? TeachingTip { get; init; }
}



