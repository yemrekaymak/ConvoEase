using Backend.Models.Enums;

namespace Backend.Services;

public static class LevelProgressionRules
{
    public static LanguageLevel? GetNextLevel(LanguageLevel currentLevel) =>
        currentLevel switch
        {
            LanguageLevel.Beginner => LanguageLevel.Intermediate,
            LanguageLevel.Intermediate => LanguageLevel.Advanced,
            _ => null
        };
}



