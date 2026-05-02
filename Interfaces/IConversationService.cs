using Microsoft.AspNetCore.Http;
using Backend.Models.Dtos;

namespace Backend.Interfaces;

public interface IConversationService
{
    Task<ConversationStartResponseDto> StartAsync(Guid userId, ConversationStartRequestDto request, CancellationToken cancellationToken = default);
    Task<ConversationMessageResponseDto> SendMessageAsync(Guid userId, Guid sessionId, string message, CancellationToken cancellationToken = default);
    Task<ConversationTranscriptResponseDto> TranscribeAudioAsync(Guid userId, Guid sessionId, IFormFile audioFile, CancellationToken cancellationToken = default);
    Task<TranscriptionPreviewResponseDto> PreviewTranscriptionAsync(IFormFile audioFile, CancellationToken cancellationToken = default);
    Task<ConversationMessageResponseDto> SendAudioAsync(Guid userId, Guid sessionId, IFormFile audioFile, CancellationToken cancellationToken = default);
    Task<SessionReportDto> FinishAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
    Task<ActiveConversationDto?> GetActiveAsync(Guid userId, CancellationToken cancellationToken = default);
}
