namespace Backend.Services;

public sealed class AiOptions
{
    public const string SectionName = "Ai";
    public string BaseUrl { get; init; } = "http://127.0.0.1:8001";
}
