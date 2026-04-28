using Backend.Models.Dtos;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Authorize]
[Route("api/scenarios")]
public sealed class ScenariosController(IScenarioService scenarioService) : BaseApiController
{
    [AllowAnonymous]
    [HttpGet("catalog")]
    public async Task<ActionResult<IReadOnlyList<ScenarioGroupDto>>> GetCatalog(CancellationToken cancellationToken)
        => Ok(await scenarioService.GetCatalogAsync(cancellationToken));

    [HttpGet("browse")]
    public async Task<ActionResult<IReadOnlyList<ScenarioGroupDto>>> GetBrowse(CancellationToken cancellationToken)
        => Ok(await scenarioService.GetBrowseAsync(GetUserId(), cancellationToken));

    [HttpGet("allowed")]
    public async Task<ActionResult<IReadOnlyList<ScenarioDto>>> GetAllowed(CancellationToken cancellationToken)
        => Ok(await scenarioService.GetAllowedScenariosAsync(GetUserId(), cancellationToken));
}



