using Backend.Models.Enums;

namespace Backend.Models.Entities;

public sealed class Scenario
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public LanguageLevel DifficultyLevel { get; set; }
    public ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();
}



