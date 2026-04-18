using Backend.Models.Enums;

namespace Backend.Models.Dtos;

public sealed class AuthResponseDto
{
    public required string AccessToken { get; init; }
    public required string RefreshToken { get; init; }
    public required DateTime AccessTokenExpiresAtUtc { get; init; }
    public required DateTime RefreshTokenExpiresAtUtc { get; init; }
    public required UserSummaryDto User { get; init; }
}

public sealed class UserSummaryDto
{
    public required Guid Id { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required string Email { get; init; }
    public LanguageLevel? CurrentLevel { get; init; }
}



