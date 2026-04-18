using Backend.Models.Enums;

namespace Backend.Models.Entities;

public sealed class UserSession
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int ScenarioId { get; set; }
    public InteractionType InteractionType { get; set; }
    public decimal? Score { get; set; }
    public bool IsCompleted { get; set; }
    public string? LastProgressJson { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public User User { get; set; } = null!;
    public Scenario Scenario { get; set; } = null!;
    public ICollection<UserMistake> Mistakes { get; set; } = new List<UserMistake>();
}



