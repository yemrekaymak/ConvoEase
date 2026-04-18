using Backend.Models.Dtos;

namespace Backend.Interfaces;

public interface ISessionService
{
    Task<SessionDto> CreateSessionAsync(Guid userId, CreateSessionRequestDto request, CancellationToken cancellationToken = default);
    Task<SessionDto> UpdateProgressAsync(Guid userId, Guid sessionId, UpdateSessionProgressRequestDto request, CancellationToken cancellationToken = default);
    Task<SessionDto> CompleteSessionAsync(Guid userId, CompleteSessionRequestDto request, CancellationToken cancellationToken = default);
}



