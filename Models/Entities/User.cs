using Backend.Models.Enums;

namespace Backend.Models.Entities;

public sealed class User
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public LanguageLevel? CurrentLevel { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}



