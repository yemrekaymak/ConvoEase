using Backend.Models.Enums;

namespace Backend.Models.Entities;

public sealed class Scenario
{
    public int Id { get; set; }
    public string GroupKey { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string PromptKey { get; set; } = string.Empty;
    public LanguageLevel DifficultyLevel { get; set; }
    public int OrderIndex { get; set; }
    public ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();
}



