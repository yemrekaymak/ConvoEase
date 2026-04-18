using Backend.Models.Dtos;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Authorize]
[Route("api/users")]
public sealed class UsersController(IUserService userService) : BaseApiController
{
    [HttpPost("level")]
    public async Task<ActionResult<UserLevelResponseDto>> UpdateLevel([FromBody] UpdateLevelRequestDto request, CancellationToken cancellationToken)
        => Ok(await userService.UpdateLevelAsync(GetUserId(), request, cancellationToken));
}



