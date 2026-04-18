using Backend.Models.Dtos;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Authorize]
[Route("api/questions")]
public sealed class QuestionsController(IQuestionService questionService) : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<QuestionDto>>> Get(CancellationToken cancellationToken)
        => Ok(await questionService.GetQuestionsAsync(cancellationToken));
}



