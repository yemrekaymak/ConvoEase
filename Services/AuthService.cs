using Backend.Common;
using Backend.Models.Dtos;
using Backend.Interfaces;
using Backend.Models.Entities;

namespace Backend.Services;

public sealed class AuthService(
    IUserRepository userRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasherService passwordHasherService,
    IJwtTokenService jwtTokenService,
    IDateTimeProvider dateTimeProvider) : IAuthService
{
    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (await userRepository.EmailExistsAsync(normalizedEmail, cancellationToken))
        {
            throw new BadRequestException("Email is already in use.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = normalizedEmail,
            PasswordHash = passwordHasherService.HashPassword(request.Password),
            CreatedAt = dateTimeProvider.UtcNow
        };

        await userRepository.AddAsync(user, cancellationToken);
        var authResponse = await CreateAuthResponseAsync(user, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return authResponse;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByEmailAsync(request.Email.Trim().ToLowerInvariant(), cancellationToken)
            ?? throw new UnauthorizedException("Invalid email or password.");

        if (!passwordHasherService.VerifyPassword(user.PasswordHash, request.Password))
        {
            throw new UnauthorizedException("Invalid email or password.");
        }

        var authResponse = await CreateAuthResponseAsync(user, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return authResponse;
    }

    public async Task<AuthResponseDto> RefreshAsync(RefreshRequestDto request, CancellationToken cancellationToken = default)
    {
        var providedToken = request.RefreshToken.Trim();
        var providedHash = jwtTokenService.HashRefreshToken(providedToken);
        var existingToken = await refreshTokenRepository.GetByTokenHashAsync(providedHash, cancellationToken)
            ?? throw new UnauthorizedException("Invalid refresh token.");

        if (existingToken.RevokedAt is not null || existingToken.ExpiresAt <= dateTimeProvider.UtcNow)
        {
            throw new UnauthorizedException("Refresh token is expired or revoked.");
        }

        var user = await userRepository.GetByIdAsync(existingToken.UserId, cancellationToken)
            ?? throw new UnauthorizedException("User not found.");

        var replacementToken = jwtTokenService.GenerateRefreshToken();
        var replacementHash = jwtTokenService.HashRefreshToken(replacementToken);
        var replacementExpiry = jwtTokenService.GetRefreshTokenExpiryUtc();

        existingToken.RevokedAt = dateTimeProvider.UtcNow;
        existingToken.ReplacedByTokenHash = replacementHash;

        await refreshTokenRepository.AddAsync(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = replacementHash,
            CreatedAt = dateTimeProvider.UtcNow,
            ExpiresAt = replacementExpiry
        }, cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return BuildAuthResponse(user, jwtTokenService.GenerateAccessToken(user), replacementToken, jwtTokenService.GetAccessTokenExpiryUtc(), replacementExpiry);
    }

    public async Task LogoutAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await refreshTokenRepository.RevokeAllForUserAsync(userId, dateTimeProvider.UtcNow, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<AuthResponseDto> CreateAuthResponseAsync(User user, CancellationToken cancellationToken)
    {
        var refreshToken = jwtTokenService.GenerateRefreshToken();
        var refreshExpiry = jwtTokenService.GetRefreshTokenExpiryUtc();

        await refreshTokenRepository.AddAsync(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = jwtTokenService.HashRefreshToken(refreshToken),
            CreatedAt = dateTimeProvider.UtcNow,
            ExpiresAt = refreshExpiry
        }, cancellationToken);

        return BuildAuthResponse(user, jwtTokenService.GenerateAccessToken(user), refreshToken, jwtTokenService.GetAccessTokenExpiryUtc(), refreshExpiry);
    }

    private static AuthResponseDto BuildAuthResponse(User user, string accessToken, string refreshToken, DateTime accessExpiry, DateTime refreshExpiry) =>
        new()
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            AccessTokenExpiresAtUtc = accessExpiry,
            RefreshTokenExpiresAtUtc = refreshExpiry,
            User = new UserSummaryDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                CurrentLevel = user.CurrentLevel
            }
        };
}



