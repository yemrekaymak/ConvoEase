namespace Backend.Models.Dtos;

public sealed class SubmitPlacementTestRequestDto
{
    public IReadOnlyList<PlacementAnswerDto> Answers { get; init; } = [];
}

public sealed class PlacementAnswerDto
{
    public int QuestionId { get; init; }
    public string SelectedOption { get; init; } = string.Empty;
}
