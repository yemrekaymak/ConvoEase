using Backend.Models.Dtos;
using FluentValidation;

namespace Backend.Validators;

public sealed class SubmitPlacementTestRequestDtoValidator : AbstractValidator<SubmitPlacementTestRequestDto>
{
    public SubmitPlacementTestRequestDtoValidator()
    {
        RuleFor(x => x.Answers)
            .NotNull()
            .NotEmpty();

        RuleForEach(x => x.Answers).SetValidator(new PlacementAnswerDtoValidator());
    }
}

public sealed class PlacementAnswerDtoValidator : AbstractValidator<PlacementAnswerDto>
{
    public PlacementAnswerDtoValidator()
    {
        RuleFor(x => x.QuestionId).GreaterThan(0);
        RuleFor(x => x.SelectedOption)
            .NotEmpty()
            .Matches("^(A|B|C|D)$")
            .WithMessage("SelectedOption must be one of A, B, C or D.");
    }
}
