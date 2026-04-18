using Backend.Models.Entities;

namespace Backend.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    string HashRefreshToken(string refreshToken);
    DateTime GetAccessTokenExpiryUtc();
    DateTime GetRefreshTokenExpiryUtc();
}



