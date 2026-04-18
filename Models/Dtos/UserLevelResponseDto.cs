using Backend.Models.Enums;

namespace Backend.Models.Dtos;

public sealed class UserLevelResponseDto
{
    public required Guid UserId { get; init; }
    public LanguageLevel? CurrentLevel { get; init; }
}



