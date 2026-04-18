using Backend.Models.Dtos;
using FluentValidation;

namespace Backend.Validators;

public sealed class CreateSessionRequestDtoValidator : AbstractValidator<CreateSessionRequestDto>
{
    public CreateSessionRequestDtoValidator()
    {
        RuleFor(x => x.ScenarioId).GreaterThan(0);
        RuleFor(x => x.InteractionType).IsInEnum();
    }
}



