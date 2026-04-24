using Backend.Models.Enums;

namespace Backend.Models.Dtos;

public sealed class ConversationStartRequestDto
{
    public int ScenarioId { get; init; }
    public InteractionType InteractionType { get; init; }
}

public sealed class ConversationStartResponseDto
{
    public required Guid SessionId { get; init; }
    public required int ScenarioId { get; init; }
    public required string ScenarioName { get; init; }
    public required InteractionType InteractionType { get; init; }
    public required string InitialMessage { get; init; }
    public required string SessionStateJson { get; init; }
}

public sealed class ConversationMessageRequestDto
{
    public string Message { get; init; } = string.Empty;
}

public sealed class ConversationFeedbackDto
{
    public required int Turn { get; init; }
    public required int Score { get; init; }
    public string? Encouragement { get; init; }
    public string? WritingFeedback { get; init; }
    public IReadOnlyList<ConversationFeedbackErrorDto> Errors { get; init; } = [];
}

public sealed class ConversationFeedbackErrorDto
{
    public string Type { get; init; } = string.Empty;
    public string WrongSentence { get; init; } = string.Empty;
    public string CorrectionText { get; init; } = string.Empty;
    public string? WhyWrong { get; init; }
    public string? TeachingTip { get; init; }
}

public sealed class ConversationMessageResponseDto
{
    public required Guid SessionId { get; init; }
    public required string Transcript { get; init; }
    public string? CharacterMessage { get; init; }
    public required ConversationFeedbackDto Feedback { get; init; }
}

public sealed class ActiveConversationDto
{
    public required Guid SessionId { get; init; }
    public required int ScenarioId { get; init; }
    public required string ScenarioName { get; init; }
    public required InteractionType InteractionType { get; init; }
    public required DateTime UpdatedAt { get; init; }
    public string? SessionStateJson { get; init; }
}
