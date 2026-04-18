using System.Security.Claims;
using Backend.Common;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
public abstract class BaseApiController : ControllerBase
{
    protected Guid GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(userId, out var parsedUserId)
            ? parsedUserId
            : throw new UnauthorizedException("User context is invalid.");
    }
}



