using Backend.Models.Enums;

namespace Backend.Models.Dtos;

public sealed class PlacementTestResultDto
{
    public required int TotalQuestions { get; init; }
    public required int CorrectAnswers { get; init; }
    public required int WrongAnswers { get; init; }
    public required decimal ScorePercentage { get; init; }
    public required LanguageLevel RecommendedLevel { get; init; }
    public required string RecommendedLevelLabel { get; init; }
}
