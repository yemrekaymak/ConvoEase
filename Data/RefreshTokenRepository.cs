using Backend.Models.Entities;
using Backend.Interfaces;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public sealed class RefreshTokenRepository(AppDbContext dbContext) : IRefreshTokenRepository
{
    public Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default) =>
        dbContext.RefreshTokens.AddAsync(refreshToken, cancellationToken).AsTask();

    public Task<RefreshToken?> GetByTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default) =>
        dbContext.RefreshTokens.FirstOrDefaultAsync(x => x.TokenHash == tokenHash, cancellationToken);

    public async Task RevokeAllForUserAsync(Guid userId, DateTime revokedAt, CancellationToken cancellationToken = default)
    {
        var activeTokens = await dbContext.RefreshTokens
            .Where(x => x.UserId == userId && x.RevokedAt == null && x.ExpiresAt > revokedAt)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.RevokedAt = revokedAt;
        }
    }
}



