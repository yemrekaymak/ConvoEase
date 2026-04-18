using Backend.Models.Enums;

namespace Backend.Models.Dtos;

public sealed class UpdateLevelRequestDto
{
    public LanguageLevel CurrentLevel { get; init; }
}



