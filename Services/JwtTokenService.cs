using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Backend.Interfaces;
using Backend.Models.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Services;

public sealed class JwtTokenService(IOptions<JwtOptions> options, IDateTimeProvider dateTimeProvider) : IJwtTokenService
{
    private readonly JwtOptions _jwtOptions = options.Value;

    public string GenerateAccessToken(User user)
    {
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SecretKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var expires = GetAccessTokenExpiryUtc();

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            notBefore: dateTimeProvider.UtcNow,
            expires: expires,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    public string HashRefreshToken(string refreshToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToHexString(bytes);
    }

    public DateTime GetAccessTokenExpiryUtc() =>
        dateTimeProvider.UtcNow.AddMinutes(_jwtOptions.AccessTokenLifetimeMinutes);

    public DateTime GetRefreshTokenExpiryUtc() =>
        dateTimeProvider.UtcNow.AddDays(_jwtOptions.RefreshTokenLifetimeDays);
}



