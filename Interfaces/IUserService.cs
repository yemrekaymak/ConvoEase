using Backend.Models.Dtos;

namespace Backend.Interfaces;

public interface IUserService
{
    Task<UserLevelResponseDto> UpdateLevelAsync(Guid userId, UpdateLevelRequestDto request, CancellationToken cancellationToken = default);
}



