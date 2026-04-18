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
    private const int MaxProgressBytes = 10 * 1024;

    public async Task<SessionDto> CreateSessionAsync(Guid userId, CreateSessionRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var scenario = await scenarioRepository.GetByIdAsync(request.ScenarioId, cancellationToken)
            ?? throw new NotFoundException("Scenario not found.");

        if (user.CurrentLevel is null || scenario.DifficultyLevel > user.CurrentLevel.Value)
        {
            throw new BadRequestException("Scenario is not available for the current user level.");
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
            session.UpdatedAt = dateTimeProvider.UtcNow;

            var mistakes = request.Mistakes.Select(m => new UserMistake
            {
                Id = Guid.NewGuid(),
                SessionId = session.Id,
                ErrorType = m.ErrorType.Trim(),
                WrongSentence = m.WrongSentence.Trim(),
                CorrectionText = m.CorrectionText.Trim()
            }).ToList();

            if (mistakes.Count > 0)
            {
                await userMistakeRepository.AddRangeAsync(mistakes, cancellationToken);
            }

            var user = await userRepository.GetByIdAsync(userId, cancellationToken)
                ?? throw new NotFoundException("User not found.");

            if (user.CurrentLevel is not null)
            {
                var scenarios = await scenarioRepository.GetByLevelAsync(user.CurrentLevel.Value, cancellationToken);
                var scenarioIds = scenarios.Select(s => s.Id).ToList();

                if (scenarioIds.Count > 0 &&
                    await userSessionRepository.HasCompletedAllScenariosForLevelAsync(userId, user.CurrentLevel.Value, scenarioIds, cancellationToken))
                {
                    user.CurrentLevel = LevelProgressionRules.GetNextLevel(user.CurrentLevel.Value) ?? user.CurrentLevel;
                }
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
            CreatedAt = session.CreatedAt,
            UpdatedAt = session.UpdatedAt
        };

    private static void ValidateProgressJson(string? progressJson)
    {
        if (string.IsNullOrWhiteSpace(progressJson))
        {
            return;
        }

        if (Encoding.UTF8.GetByteCount(progressJson) > MaxProgressBytes)
        {
            throw new BadRequestException("LastProgressJson cannot exceed 10KB.");
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
}



