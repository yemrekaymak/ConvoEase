using Backend.Models.Dtos;

namespace Backend.Interfaces;

public interface IQuestionService
{
    Task<IReadOnlyList<QuestionDto>> GetQuestionsAsync(CancellationToken cancellationToken = default);
}



