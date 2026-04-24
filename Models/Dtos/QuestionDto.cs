namespace Backend.Models.Dtos;

public sealed class QuestionDto
{
    public required int Id { get; init; }
    public required string Text { get; init; }
    public required string Category { get; init; }
    public string? PassageTitle { get; init; }
    public string? PassageText { get; init; }
    public required IReadOnlyList<QuestionOptionDto> Options { get; init; }
}

public sealed class QuestionOptionDto
{
    public required string Key { get; init; }
    public required string Text { get; init; }
}



