using Backend.Common;
using Backend.Models.Dtos;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Authorize]
[Route("api/mistakes")]
public sealed class MistakesController(IMistakeService mistakeService) : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<PagedResponseDto<MistakeDto>>> Get([FromQuery] int? scenarioId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        if (page <= 0 || pageSize <= 0)
        {
            throw new BadRequestException("Page and pageSize must be greater than zero.");
        }

        return Ok(await mistakeService.GetMistakesAsync(GetUserId(), scenarioId, page, pageSize, cancellationToken));
    }
}



