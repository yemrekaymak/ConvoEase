using Backend.Models.Dtos;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : BaseApiController
{
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequestDto request, CancellationToken cancellationToken)
        => Ok(await authService.RegisterAsync(request, cancellationToken));

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request, CancellationToken cancellationToken)
        => Ok(await authService.LoginAsync(request, cancellationToken));

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh([FromBody] RefreshRequestDto request, CancellationToken cancellationToken)
        => Ok(await authService.RefreshAsync(request, cancellationToken));

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        await authService.LogoutAsync(GetUserId(), cancellationToken);
        return NoContent();
    }
}



