using Backend.Interfaces;
using Backend.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Authorize]
[Route("api/conversations")]
public sealed class ConversationsController(IConversationService conversationService) : BaseApiController
{
    [HttpGet("active")]
    public async Task<ActionResult<ActiveConversationDto?>> GetActive(CancellationToken cancellationToken)
        => Ok(await conversationService.GetActiveAsync(GetUserId(), cancellationToken));

    [HttpPost("start")]
    public async Task<ActionResult<ConversationStartResponseDto>> Start([FromBody] ConversationStartRequestDto request, CancellationToken cancellationToken)
        => Ok(await conversationService.StartAsync(GetUserId(), request, cancellationToken));

    [HttpPost("{sessionId:guid}/message")]
    public async Task<ActionResult<ConversationMessageResponseDto>> SendMessage(Guid sessionId, [FromBody] ConversationMessageRequestDto request, CancellationToken cancellationToken)
        => Ok(await conversationService.SendMessageAsync(GetUserId(), sessionId, request.Message, cancellationToken));

    [HttpPost("{sessionId:guid}/speech")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    public async Task<ActionResult<ConversationMessageResponseDto>> SendSpeech(Guid sessionId, [FromForm] IFormFile audioFile, CancellationToken cancellationToken)
        => Ok(await conversationService.SendAudioAsync(GetUserId(), sessionId, audioFile, cancellationToken));

    [HttpPost("{sessionId:guid}/transcribe")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    public async Task<ActionResult<ConversationTranscriptResponseDto>> Transcribe(Guid sessionId, [FromForm] IFormFile audioFile, CancellationToken cancellationToken)
        => Ok(await conversationService.TranscribeAudioAsync(GetUserId(), sessionId, audioFile, cancellationToken));

    [HttpPost("transcribe-preview")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    public async Task<ActionResult<TranscriptionPreviewResponseDto>> TranscribePreview([FromForm] IFormFile audioFile, CancellationToken cancellationToken)
        => Ok(await conversationService.PreviewTranscriptionAsync(audioFile, cancellationToken));

    [HttpPost("{sessionId:guid}/finish")]
    public async Task<ActionResult<SessionReportDto>> Finish(Guid sessionId, CancellationToken cancellationToken)
        => Ok(await conversationService.FinishAsync(GetUserId(), sessionId, cancellationToken));
}
