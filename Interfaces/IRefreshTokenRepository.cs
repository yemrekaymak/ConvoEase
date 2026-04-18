using Backend.Models.Entities;

namespace Backend.Interfaces;

public interface IRefreshTokenRepository
{
    Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default);
    Task<RefreshToken?> GetByTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default);
    Task RevokeAllForUserAsync(Guid userId, DateTime revokedAt, CancellationToken cancellationToken = default);
}



