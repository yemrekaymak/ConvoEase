using Backend.Models.Dtos;

namespace Backend.Interfaces;

public interface IMistakeService
{
    Task<PagedResponseDto<MistakeDto>> GetMistakesAsync(Guid userId, int? scenarioId, int page, int pageSize, CancellationToken cancellationToken = default);
}



