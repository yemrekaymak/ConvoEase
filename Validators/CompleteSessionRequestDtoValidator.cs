using Backend.Models.Dtos;
using FluentValidation;

namespace Backend.Validators;

public sealed class CompleteSessionRequestDtoValidator : AbstractValidator<CompleteSessionRequestDto>
{
    public CompleteSessionRequestDtoValidator()
    {
        RuleFor(x => x.SessionId).NotEmpty();
        RuleFor(x => x.Score).InclusiveBetween(0, 100);
        RuleFor(x => x.SummaryReport).MaximumLength(4000);
        RuleFor(x => x.Mistakes).NotNull();
        RuleForEach(x => x.Mistakes).SetValidator(new SessionMistakeInputDtoValidator());
    }
}

public sealed class SessionMistakeInputDtoValidator : AbstractValidator<SessionMistakeInputDto>
{
    public SessionMistakeInputDtoValidator()
    {
        RuleFor(x => x.ErrorType).NotEmpty().MaximumLength(100);
        RuleFor(x => x.WrongSentence).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.CorrectionText).NotEmpty().MaximumLength(1000);
    }
}



