using System.Text;
using System.Text.Json;
using Backend.Models.Dtos;
using FluentValidation;

namespace Backend.Validators;

public sealed class UpdateSessionProgressRequestDtoValidator : AbstractValidator<UpdateSessionProgressRequestDto>
{
    private const int MaxProgressBytes = 10 * 1024;

    public UpdateSessionProgressRequestDtoValidator()
    {
        RuleFor(x => x.LastProgressJson)
            .Must(BeValidSize).WithMessage("LastProgressJson cannot exceed 10KB.")
            .Must(BeValidJson).WithMessage("LastProgressJson must be valid JSON.")
            .When(x => !string.IsNullOrWhiteSpace(x.LastProgressJson));
    }

    private static bool BeValidSize(string? value) =>
        value is null || Encoding.UTF8.GetByteCount(value) <= MaxProgressBytes;

    private static bool BeValidJson(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        try
        {
            JsonDocument.Parse(value);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}



