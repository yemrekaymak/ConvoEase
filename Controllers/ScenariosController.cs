using Backend.Models.Dtos;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Authorize]
[Route("api/scenarios")]
public sealed class ScenariosController(IScenarioService scenarioService) : BaseApiController
{
    [HttpGet("allowed")]
    public async Task<ActionResult<IReadOnlyList<ScenarioDto>>> GetAllowed(CancellationToken cancellationToken)
        => Ok(await scenarioService.GetAllowedScenariosAsync(GetUserId(), cancellationToken));
}



