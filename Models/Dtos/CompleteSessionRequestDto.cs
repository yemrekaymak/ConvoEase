namespace Backend.Models.Dtos;

public sealed class CompleteSessionRequestDto
{
    public Guid SessionId { get; init; }
    public decimal Score { get; init; }
    public IReadOnlyList<SessionMistakeInputDto> Mistakes { get; init; } = [];
}

public sealed class SessionMistakeInputDto
{
    public string ErrorType { get; init; } = string.Empty;
    public string WrongSentence { get; init; } = string.Empty;
    public string CorrectionText { get; init; } = string.Empty;
}



