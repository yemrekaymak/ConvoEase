using Backend.Models.Dtos;
using Backend.Interfaces;

namespace Backend.Services;

public sealed class MistakeService(IUserMistakeRepository userMistakeRepository) : IMistakeService
{
    public async Task<PagedResponseDto<MistakeDto>> GetMistakesAsync(Guid userId, int? scenarioId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var result = await userMistakeRepository.GetPagedForUserAsync(userId, scenarioId, page, pageSize, cancellationToken);

        return new PagedResponseDto<MistakeDto>
        {
            Items = result.Items.Select(m => new MistakeDto
            {
                Id = m.Id,
                SessionId = m.SessionId,
                ScenarioId = m.Session.ScenarioId,
                ScenarioName = m.Session.Scenario.Name,
                ErrorType = m.ErrorType,
                WrongSentence = m.WrongSentence,
                CorrectionText = m.CorrectionText
            }).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = result.TotalCount
        };
    }
}



