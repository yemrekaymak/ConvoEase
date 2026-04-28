using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Backend.Common;
using Backend.Interfaces;
using Backend.Models.Dtos;
using Backend.Models.Entities;
using Backend.Models.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace Backend.Services;

public sealed class ConversationService(
    HttpClient httpClient,
    IOptions<AiOptions> aiOptions,
    IUserRepository userRepository,
    IScenarioRepository scenarioRepository,
    IUserSessionRepository userSessionRepository,
    ISessionService sessionService) : IConversationService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly string _aiBaseUrl = aiOptions.Value.BaseUrl.TrimEnd('/');

    public async Task<ConversationStartResponseDto> StartAsync(Guid userId, ConversationStartRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");
        var scenario = await scenarioRepository.GetByIdAsync(request.ScenarioId, cancellationToken)
            ?? throw new NotFoundException("Scenario not found.");

        if (user.CurrentLevel is null)
        {
            throw new BadRequestException("Placement test must be completed first.");
        }

        var session = await sessionService.CreateSessionAsync(userId, new CreateSessionRequestDto
        {
            ScenarioId = request.ScenarioId,
            InteractionType = request.InteractionType
        }, cancellationToken);

        var aiPayload = new
        {
            oturum_id = session.Id,
            kullanici_id = user.Id,
            seviye = ToCefrLevel(user.CurrentLevel.Value),
            senaryo = scenario.PromptKey,
            senaryo_id = scenario.Id,
            interaction_type = request.InteractionType == InteractionType.Speaking ? "speaking" : "writing"
        };

        var aiResponse = await PostJsonAsync<AiStartResponse>("/backend/oturum/hazirla", aiPayload, cancellationToken);

        await sessionService.UpdateProgressAsync(userId, session.Id, new UpdateSessionProgressRequestDto
        {
            LastProgressJson = aiResponse.SessionStateJson
        }, cancellationToken);

        return new ConversationStartResponseDto
        {
            SessionId = session.Id,
            ScenarioId = scenario.Id,
            ScenarioName = scenario.Name,
            InteractionType = request.InteractionType,
            InitialMessage = aiResponse.CharacterMessage,
            SessionStateJson = aiResponse.SessionStateJson
        };
    }

    public async Task<ConversationMessageResponseDto> SendMessageAsync(Guid userId, Guid sessionId, string message, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            throw new BadRequestException("Message is required.");
        }

        var session = await GetOpenSessionAsync(userId, sessionId, cancellationToken);
        var aiResponse = await PostJsonAsync<AiMessageResponse>("/backend/mesaj", new
        {
            session_state_json = session.LastProgressJson ?? "{}",
            mesaj = message.Trim()
        }, cancellationToken);

        await sessionService.UpdateProgressAsync(userId, sessionId, new UpdateSessionProgressRequestDto
        {
            LastProgressJson = aiResponse.SessionStateJson
        }, cancellationToken);

        return new ConversationMessageResponseDto
        {
            SessionId = sessionId,
            Transcript = aiResponse.Transcript,
            CharacterMessage = aiResponse.CharacterMessage,
            Feedback = MapFeedback(aiResponse.Evaluation)
        };
    }

    public async Task<ConversationMessageResponseDto> SendAudioAsync(Guid userId, Guid sessionId, IFormFile audioFile, CancellationToken cancellationToken = default)
    {
        if (audioFile.Length <= 0)
        {
            throw new BadRequestException("Audio file is required.");
        }

        await GetOpenSessionAsync(userId, sessionId, cancellationToken);

        using var form = new MultipartFormDataContent();
        await using var stream = audioFile.OpenReadStream();
        using var memory = new MemoryStream();
        await stream.CopyToAsync(memory, cancellationToken);
        memory.Position = 0;

        using var fileContent = new ByteArrayContent(memory.ToArray());
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(audioFile.ContentType ?? "audio/m4a");
        form.Add(fileContent, "dosya", audioFile.FileName);

        var transcription = await PostMultipartAsync<AiTranscriptionResponse>("/backend/ses-metni", form, cancellationToken);
        return await SendMessageAsync(userId, sessionId, transcription.Transcript, cancellationToken);
    }

    public async Task<SessionReportDto> FinishAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await GetOpenSessionAsync(userId, sessionId, cancellationToken);
        var aiResponse = await PostJsonAsync<AiFinishResponse>("/backend/oturum/bitir", new
        {
            session_state_json = session.LastProgressJson ?? "{}"
        }, cancellationToken);

        await sessionService.CompleteSessionAsync(userId, new CompleteSessionRequestDto
        {
            SessionId = sessionId,
            Score = aiResponse.AverageScore,
            SummaryReport = aiResponse.Report,
            Mistakes = aiResponse.Mistakes.Select(MapMistake).ToList()
        }, cancellationToken);

        return await sessionService.GetReportAsync(userId, sessionId, cancellationToken);
    }

    public async Task<ActiveConversationDto?> GetActiveAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var session = await userSessionRepository.GetLatestIncompleteForUserAsync(userId, cancellationToken);
        if (session is null)
        {
            return null;
        }

        return new ActiveConversationDto
        {
            SessionId = session.Id,
            ScenarioId = session.ScenarioId,
            ScenarioName = session.Scenario.Name,
            InteractionType = session.InteractionType,
            UpdatedAt = session.UpdatedAt,
            SessionStateJson = session.LastProgressJson
        };
    }

    private async Task<UserSession> GetOpenSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken)
    {
        var session = await userSessionRepository.GetByIdForUserAsync(sessionId, userId, cancellationToken)
            ?? throw new NotFoundException("Session not found.");
        if (session.IsCompleted)
        {
            throw new BadRequestException("Session is already completed.");
        }
        if (string.IsNullOrWhiteSpace(session.LastProgressJson))
        {
            throw new BadRequestException("Session state is missing.");
        }
        return session;
    }

    private async Task<T> PostJsonAsync<T>(string path, object payload, CancellationToken cancellationToken)
    {
        HttpResponseMessage response;
        try
        {
            response = await httpClient.PostAsync(
                $"{_aiBaseUrl}{path}",
                new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json"),
                cancellationToken);
        }
        catch (HttpRequestException)
        {
            throw new BadRequestException("AI service is unavailable.");
        }
        catch (TaskCanceledException)
        {
            throw new BadRequestException("AI service timed out.");
        }

        return await ReadResponseAsync<T>(response, cancellationToken);
    }

    private async Task<T> PostMultipartAsync<T>(string path, MultipartFormDataContent content, CancellationToken cancellationToken)
    {
        HttpResponseMessage response;
        try
        {
            response = await httpClient.PostAsync($"{_aiBaseUrl}{path}", content, cancellationToken);
        }
        catch (HttpRequestException)
        {
            throw new BadRequestException("AI service is unavailable.");
        }
        catch (TaskCanceledException)
        {
            throw new BadRequestException("AI service timed out.");
        }

        return await ReadResponseAsync<T>(response, cancellationToken);
    }

    private static async Task<T> ReadResponseAsync<T>(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new BadRequestException($"AI request failed: {body}");
        }

        var value = JsonSerializer.Deserialize<T>(body, JsonOptions);
        if (value is null)
        {
            throw new BadRequestException("AI response could not be parsed.");
        }

        return value;
    }

    private static SessionMistakeInputDto MapMistake(AiMistake mistake) =>
        new()
        {
            ErrorType = mistake.ErrorType,
            WrongSentence = mistake.WrongSentence,
            CorrectionText = mistake.CorrectionText,
            WhyWrong = mistake.WhyWrong,
            TeachingTip = mistake.TeachingTip
        };

    private static ConversationFeedbackDto MapFeedback(AiEvaluation evaluation) =>
        new()
        {
            Turn = evaluation.Turn,
            Score = evaluation.Score,
            Encouragement = evaluation.Encouragement,
            WritingFeedback = evaluation.WritingFeedback,
            Errors = evaluation.Errors.Select(x => new ConversationFeedbackErrorDto
            {
                Type = x.Type,
                WrongSentence = x.WrongSentence,
                CorrectionText = x.CorrectionText,
                WhyWrong = x.WhyWrong,
                TeachingTip = x.TeachingTip
            }).ToList()
        };

    private static string ToCefrLevel(LanguageLevel level) =>
        level switch
        {
            LanguageLevel.Beginner => "A2",
            LanguageLevel.Intermediate => "B1",
            _ => "C1"
        };

    private sealed class AiStartResponse
    {
        public required string CharacterMessage { get; init; }
        public required string SessionStateJson { get; init; }
    }

    private sealed class AiMessageResponse
    {
        public string? CharacterMessage { get; init; }
        public required AiEvaluation Evaluation { get; init; }
        public required string SessionStateJson { get; init; }
        public required string Transcript { get; init; }
    }

    private sealed class AiFinishResponse
    {
        public required string Report { get; init; }
        public required decimal AverageScore { get; init; }
        public IReadOnlyList<AiMistake> Mistakes { get; init; } = [];
    }

    private sealed class AiTranscriptionResponse
    {
        public required string Transcript { get; init; }
    }

    private sealed class AiEvaluation
    {
        public int Turn { get; init; }
        public int Score { get; init; }
        public string? Encouragement { get; init; }
        public string? WritingFeedback { get; init; }
        public IReadOnlyList<AiError> Errors { get; init; } = [];
    }

    private sealed class AiError
    {
        public string Type { get; init; } = string.Empty;
        public string WrongSentence { get; init; } = string.Empty;
        public string CorrectionText { get; init; } = string.Empty;
        public string? WhyWrong { get; init; }
        public string? TeachingTip { get; init; }
    }

    private sealed class AiMistake
    {
        public string ErrorType { get; init; } = string.Empty;
        public string WrongSentence { get; init; } = string.Empty;
        public string CorrectionText { get; init; } = string.Empty;
        public string? WhyWrong { get; init; }
        public string? TeachingTip { get; init; }
    }
}
