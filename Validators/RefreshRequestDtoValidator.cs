using Backend.Models.Dtos;
using FluentValidation;

namespace Backend.Validators;

public sealed class RefreshRequestDtoValidator : AbstractValidator<RefreshRequestDto>
{
    public RefreshRequestDtoValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}



