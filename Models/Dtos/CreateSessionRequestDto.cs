using Backend.Models.Enums;

namespace Backend.Models.Dtos;

public sealed class CreateSessionRequestDto
{
    public int ScenarioId { get; init; }
    public InteractionType InteractionType { get; init; }
}



