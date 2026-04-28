using System.Text;
using System.Text.Json;
using Backend.Common;
using Backend.Models.Dtos;
using Backend.Interfaces;
using Backend.Models.Entities;

namespace Backend.Services;

public sealed class SessionService(
    IUserRepository userRepository,
    IScenarioRepository scenarioRepository,
    IUserSessionRepository userSessionRepository,
    IUserMistakeRepository userMistakeRepository,
    IUnitOfWork unitOfWork,
    IDateTimeProvider dateTimeProvider) : ISessionService
{
    private const int MaxProgressBytes = 128 * 1024;

    public async Task<SessionDto> CreateSessionAsync(Guid userId, CreateSessionRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var scenario = await scenarioRepository.GetByIdAsync(request.ScenarioId, cancellationToken)
            ?? throw new NotFoundException("Scenario not found.");

        if (user.CurrentLevel is null)
        {
            throw new BadRequestException("Scenario is not available for the current user level.");
        }

        var allScenarios = await scenarioRepository.GetAllAsync(cancellationToken);
        var completedScenarioIds = await userSessionRepository.GetCompletedScenarioIdsAsync(userId, cancellationToken);
        var accessMap = ScenarioUnlockRules.Evaluate(allScenarios, user.CurrentLevel.Value, completedScenarioIds);

        if (!accessMap.TryGetValue(scenario.Id, out var access) || !access.IsUnlocked)
        {
            throw new BadRequestException("Scenario is locked for the current user.");
        }

        var utcNow = dateTimeProvider.UtcNow;
        var session = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ScenarioId = request.ScenarioId,
            InteractionType = request.InteractionType,
            IsCompleted = false,
            CreatedAt = utcNow,
            UpdatedAt = utcNow
        };

        await userSessionRepository.AddAsync(session, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapSession(session);
    }

    public async Task<SessionDto> UpdateProgressAsync(Guid userId, Guid sessionId, UpdateSessionProgressRequestDto request, CancellationToken cancellationToken = default)
    {
        var session = await userSessionRepository.GetByIdForUserAsync(sessionId, userId, cancellationToken)
            ?? throw new NotFoundException("Session not found.");

        if (session.IsCompleted)
        {
            throw new BadRequestException("Session is already completed.");
        }

        ValidateProgressJson(request.LastProgressJson);
        session.LastProgressJson = request.LastProgressJson;
        session.UpdatedAt = dateTimeProvider.UtcNow;

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MapSession(session);
    }

    public async Task<SessionDto> CompleteSessionAsync(Guid userId, CompleteSessionRequestDto request, CancellationToken cancellationToken = default)
    {
        var session = await userSessionRepository.GetByIdForUserAsync(request.SessionId, userId, cancellationToken)
            ?? throw new NotFoundException("Session not found.");

        if (session.IsCompleted)
        {
            throw new BadRequestException("Session is already completed.");
        }

        await using var transaction = await unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            session.IsCompleted = true;
            session.Score = request.Score;
            session.LastProgressJson = null;
            session.SummaryReport = NormalizeSummaryReport(request.SummaryReport);
            session.UpdatedAt = dateTimeProvider.UtcNow;

            var mistakes = request.Mistakes.Select(m => new UserMistake
            {
                Id = Guid.NewGuid(),
                SessionId = session.Id,
                ErrorType = m.ErrorType.Trim(),
                WrongSentence = m.WrongSentence.Trim(),
                CorrectionText = m.CorrectionText.Trim(),
                WhyWrong = NormalizeOptionalText(m.WhyWrong),
                TeachingTip = NormalizeOptionalText(m.TeachingTip)
            }).ToList();

            if (mistakes.Count > 0)
            {
                await userMistakeRepository.AddRangeAsync(mistakes, cancellationToken);
            }

            await unitOfWork.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        return MapSession(session);
    }

    private static SessionDto MapSession(UserSession session) =>
        new()
        {
            Id = session.Id,
            ScenarioId = session.ScenarioId,
            InteractionType = session.InteractionType,
            Score = session.Score,
            IsCompleted = session.IsCompleted,
            LastProgressJson = session.LastProgressJson,
            SummaryReport = session.SummaryReport,
            CreatedAt = session.CreatedAt,
            UpdatedAt = session.UpdatedAt
        };

    public async Task<SessionReportDto> GetReportAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await userSessionRepository.GetByIdForUserAsync(sessionId, userId, cancellationToken)
            ?? throw new NotFoundException("Session not found.");

        return new SessionReportDto
        {
            SessionId = session.Id,
            ScenarioId = session.ScenarioId,
            ScenarioName = session.Scenario.Name,
            InteractionType = session.InteractionType,
            Score = session.Score,
            SummaryReport = session.SummaryReport,
            IsCompleted = session.IsCompleted,
            CreatedAt = session.CreatedAt,
            UpdatedAt = session.UpdatedAt,
            Mistakes = session.Mistakes
                .OrderBy(x => x.ErrorType)
                .ThenBy(x => x.WrongSentence)
                .Select(x => new MistakeDto
                {
                    Id = x.Id,
                    SessionId = x.SessionId,
                    ScenarioId = session.ScenarioId,
                    ScenarioName = session.Scenario.Name,
                    ErrorType = x.ErrorType,
                    WrongSentence = x.WrongSentence,
                    CorrectionText = x.CorrectionText,
                    WhyWrong = x.WhyWrong,
                    TeachingTip = x.TeachingTip
                })
                .ToList()
        };
    }

    private static void ValidateProgressJson(string? progressJson)
    {
        if (string.IsNullOrWhiteSpace(progressJson))
        {
            return;
        }

        if (Encoding.UTF8.GetByteCount(progressJson) > MaxProgressBytes)
        {
            throw new BadRequestException("LastProgressJson cannot exceed 128KB.");
        }

        try
        {
            JsonDocument.Parse(progressJson);
        }
        catch (JsonException)
        {
            throw new BadRequestException("LastProgressJson must be valid JSON.");
        }
    }

    private static string? NormalizeSummaryReport(string? summaryReport)
    {
        if (string.IsNullOrWhiteSpace(summaryReport))
        {
            return null;
        }

        return summaryReport.Trim();
    }

    private static string? NormalizeOptionalText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }
}



