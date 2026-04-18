using Backend.Models.Dtos;
using Backend.Interfaces;

namespace Backend.Services;

public sealed class QuestionService(IQuestionRepository questionRepository) : IQuestionService
{
    public async Task<IReadOnlyList<QuestionDto>> GetQuestionsAsync(CancellationToken cancellationToken = default)
    {
        var questions = await questionRepository.GetAllAsync(cancellationToken);
        return questions.Select(q => new QuestionDto { Id = q.Id, Text = q.Text }).ToList();
    }
}



