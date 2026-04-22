using Backend.Common;
using Backend.Models.Dtos;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Authorize]
[Route("api/sessions")]
public sealed class SessionsController(ISessionService sessionService) : BaseApiController
{
    [HttpPost]
    public async Task<ActionResult<SessionDto>> Create([FromBody] CreateSessionRequestDto request, CancellationToken cancellationToken)
        => Ok(await sessionService.CreateSessionAsync(GetUserId(), request, cancellationToken));

    [HttpPost("complete")]
    public async Task<ActionResult<SessionDto>> Complete([FromBody] CompleteSessionRequestDto request, CancellationToken cancellationToken)
        => Ok(await sessionService.CompleteSessionAsync(GetUserId(), request, cancellationToken));

    [HttpGet("{id:guid}/report")]
    public async Task<ActionResult<SessionReportDto>> GetReport(Guid id, CancellationToken cancellationToken)
        => Ok(await sessionService.GetReportAsync(GetUserId(), id, cancellationToken));

    [HttpPatch("{id:guid}/progress")]
    public async Task<ActionResult<SessionDto>> UpdateProgress(Guid id, [FromBody] UpdateSessionProgressRequestDto request, CancellationToken cancellationToken)
    {
        if (request is null)
        {
            throw new BadRequestException("Request body is required.");
        }

        return Ok(await sessionService.UpdateProgressAsync(GetUserId(), id, request, cancellationToken));
    }
}



