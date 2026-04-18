using Backend.Models.Dtos;
using FluentValidation;

namespace Backend.Validators;

public sealed class UpdateLevelRequestDtoValidator : AbstractValidator<UpdateLevelRequestDto>
{
    public UpdateLevelRequestDtoValidator()
    {
        RuleFor(x => x.CurrentLevel).IsInEnum();
    }
}



