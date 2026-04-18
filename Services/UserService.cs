using Backend.Common;
using Backend.Models.Dtos;
using Backend.Interfaces;

namespace Backend.Services;

public sealed class UserService(IUserRepository userRepository, IUnitOfWork unitOfWork) : IUserService
{
    public async Task<UserLevelResponseDto> UpdateLevelAsync(Guid userId, UpdateLevelRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        user.CurrentLevel = request.CurrentLevel;
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new UserLevelResponseDto
        {
            UserId = user.Id,
            CurrentLevel = user.CurrentLevel
        };
    }
}



