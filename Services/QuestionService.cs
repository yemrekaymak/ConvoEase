using Backend.Common;
using Backend.Models.Dtos;
using Backend.Models.Enums;
using Backend.Interfaces;

namespace Backend.Services;

public sealed class QuestionService(IUserRepository userRepository, IUnitOfWork unitOfWork) : IQuestionService
{
    private static readonly IReadOnlyList<PlacementQuestionDefinition> Questions = BuildQuestions();

    public Task<IReadOnlyList<QuestionDto>> GetQuestionsAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<QuestionDto>>(Questions.Select(MapQuestion).ToList());

    public async Task<PlacementTestResultDto> SubmitPlacementTestAsync(Guid userId, SubmitPlacementTestRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        if (request.Answers.Count != Questions.Count)
        {
            throw new BadRequestException($"All {Questions.Count} placement questions must be answered.");
        }

        var answerMap = request.Answers
            .GroupBy(x => x.QuestionId)
            .ToDictionary(g => g.Key, g => g.Last().SelectedOption.Trim().ToUpperInvariant());

        if (answerMap.Count != Questions.Count || Questions.Any(x => !answerMap.ContainsKey(x.Id)))
        {
            throw new BadRequestException("Submitted answers do not match the placement test question set.");
        }

        var correctAnswers = Questions.Count(x => answerMap.TryGetValue(x.Id, out var selected) && selected == x.CorrectOption);
        var wrongAnswers = Questions.Count - correctAnswers;
        var percentage = Math.Round((decimal)correctAnswers / Questions.Count * 100m, 2);
        var level = ResolveLevel(correctAnswers);

        user.CurrentLevel = level;
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new PlacementTestResultDto
        {
            TotalQuestions = Questions.Count,
            CorrectAnswers = correctAnswers,
            WrongAnswers = wrongAnswers,
            ScorePercentage = percentage,
            RecommendedLevel = level,
            RecommendedLevelLabel = ResolveLevelLabel(level)
        };
    }

    private static LanguageLevel ResolveLevel(int correctAnswers) =>
        correctAnswers switch
        {
            <= 7 => LanguageLevel.Beginner,
            <= 16 => LanguageLevel.Intermediate,
            _ => LanguageLevel.Advanced
        };

    private static string ResolveLevelLabel(LanguageLevel level) =>
        level switch
        {
            LanguageLevel.Beginner => "Kolay",
            LanguageLevel.Intermediate => "Orta",
            _ => "Zor"
        };

    private static QuestionDto MapQuestion(PlacementQuestionDefinition question) =>
        new()
        {
            Id = question.Id,
            Text = question.Text,
            Category = question.Category,
            PassageTitle = question.PassageTitle,
            PassageText = question.PassageText,
            Options = question.Options
                .Select(x => new QuestionOptionDto
                {
                    Key = x.Key,
                    Text = x.Text
                })
                .ToList()
        };

    private static IReadOnlyList<PlacementQuestionDefinition> BuildQuestions()
    {
        const string smallIsBeautifulPassage =
            """
            Some economists argue that modern life pushes people to value constant consumption, while earlier societies relied more on sharing and social balance. In that older gift-based view, people built trust by giving and receiving within a community instead of treating everything as a market transaction. The writer uses examples from early hunting societies to show that cooperation once played a larger role in survival than competition alone.
            """;

        const string cultureAndRomancePassage =
            """
            Anthropologists note that ideas about romance and marriage are shaped by culture as much as by personal feeling. In some communities, family expectations strongly influence partner choice, while in others individual experience plays a larger role. Researchers therefore argue that romantic behaviour cannot be explained by biology alone; past experiences and social learning also affect what people expect from a long-term relationship.
            """;

        return
        [
            new(1, "While I _____ dinner last night, my sister _____ me from Ankara.", "Grammar", "A",
            [
                new("A", "was preparing / called"),
                new("B", "prepared / was calling"),
                new("C", "am preparing / called"),
                new("D", "have prepared / has called")
            ]),
            new(2, "They _____ on this project for three hours, so they need a short break now.", "Grammar", "C",
            [
                new("A", "worked"),
                new("B", "work"),
                new("C", "have been working"),
                new("D", "had worked")
            ]),
            new(3, "You _____ touch that switch. It is dangerous.", "Grammar", "B",
            [
                new("A", "should"),
                new("B", "mustn't"),
                new("C", "would"),
                new("D", "could")
            ]),
            new(4, "You _____ your passport at the airport. Now we have to wait for the report.", "Grammar", "D",
            [
                new("A", "mustn't lose"),
                new("B", "shouldn't lose"),
                new("C", "can't have lost"),
                new("D", "shouldn't have lost")
            ]),
            new(5, "This is the village _____ my grandparents were born.", "Grammar", "A",
            [
                new("A", "where"),
                new("B", "which"),
                new("C", "who"),
                new("D", "whose")
            ]),
            new(6, "The new bridge, _____ was completed last month, has already changed traffic patterns.", "Grammar", "B",
            [
                new("A", "where"),
                new("B", "which"),
                new("C", "what"),
                new("D", "whose")
            ]),
            new(7, "You finished the report yesterday, _____?", "Grammar", "C",
            [
                new("A", "didn't you do"),
                new("B", "haven't you"),
                new("C", "didn't you"),
                new("D", "don't you")
            ]),
            new(8, "If she had studied medicine, she _____ working at that hospital now.", "Grammar", "D",
            [
                new("A", "is"),
                new("B", "was"),
                new("C", "will be"),
                new("D", "would be")
            ]),
            new(9, "Do you know _____ after the meeting?", "Grammar", "B",
            [
                new("A", "where are they going"),
                new("B", "where they are going"),
                new("C", "where going they are"),
                new("D", "where they going are")
            ]),
            new(10, "_____ all the data, the researcher started writing the final report.", "Grammar", "A",
            [
                new("A", "Having collected"),
                new("B", "Collected"),
                new("C", "To collect"),
                new("D", "Collecting by")
            ]),
            new(11, "Can you _____ my little brother while I go to the pharmacy?", "Vocabulary", "C",
            [
                new("A", "look into"),
                new("B", "look up"),
                new("C", "look after"),
                new("D", "look over")
            ]),
            new(12, "After a few weeks of rest, she finally began to _____ from the illness.", "Vocabulary", "B",
            [
                new("A", "refuse"),
                new("B", "recover"),
                new("C", "replace"),
                new("D", "reduce")
            ]),
            new(13, "The lawyer tried to _____ the witness to tell the truth.", "Vocabulary", "A",
            [
                new("A", "convince"),
                new("B", "depend"),
                new("C", "discover"),
                new("D", "interrupt")
            ]),
            new(14, "Our team managed to _____ all the goals set for this quarter.", "Vocabulary", "D",
            [
                new("A", "announce"),
                new("B", "compare"),
                new("C", "delay"),
                new("D", "achieve")
            ]),
            new(15, "The engineer measured the equipment _____ before writing the report.", "Vocabulary", "A",
            [
                new("A", "precisely"),
                new("B", "rarely"),
                new("C", "poorly"),
                new("D", "openly")
            ]),
            new(16, "The article explained that the climber acted out of pure _____ after being trapped for days.", "Vocabulary", "B",
            [
                new("A", "comfort"),
                new("B", "desperation"),
                new("C", "discipline"),
                new("D", "curiosity")
            ]),
            new(17, "Many young scientists _____ to the research project during the summer program.", "Vocabulary", "D",
            [
                new("A", "opposed"),
                new("B", "hesitated"),
                new("C", "removed"),
                new("D", "contributed")
            ]),
            new(18, "She _____ stayed after work to help the new students prepare for the presentation.", "Vocabulary", "C",
            [
                new("A", "secretly"),
                new("B", "politely"),
                new("C", "willingly"),
                new("D", "roughly")
            ]),
            new(19, "According to the passage, earlier gift-based communities mainly valued _____?", "Reading", "A",
            [
                new("A", "mutual support and trust"),
                new("B", "rapid industrial growth"),
                new("C", "strict legal systems"),
                new("D", "individual wealth above all")
            ], "Small Is Beautiful", smallIsBeautifulPassage),
            new(20, "The writer mentions early hunting societies mainly to _____", "Reading", "C",
            [
                new("A", "criticize modern science"),
                new("B", "prove that trade never existed"),
                new("C", "illustrate the difference between cooperation and pure competition"),
                new("D", "show that modern cities are safer")
            ], "Small Is Beautiful", smallIsBeautifulPassage),
            new(21, "The main argument of the passage is that modern economies often ignore _____", "Reading", "D",
            [
                new("A", "technology"),
                new("B", "transportation"),
                new("C", "population growth"),
                new("D", "the human need for social balance")
            ], "Small Is Beautiful", smallIsBeautifulPassage),
            new(22, "Which statement best matches the writer's opinion?", "Reading", "B",
            [
                new("A", "Competition is the only force behind progress."),
                new("B", "A healthy economy should include more than buying and selling."),
                new("C", "Gift economies can only work in large cities."),
                new("D", "Older societies rejected all forms of exchange.")
            ], "Small Is Beautiful", smallIsBeautifulPassage),
            new(23, "According to the second passage, ideas about marriage are influenced by _____", "Reading", "A",
            [
                new("A", "both culture and personal experience"),
                new("B", "biology only"),
                new("C", "economic systems only"),
                new("D", "random chance only")
            ], "Culture and Romance", cultureAndRomancePassage),
            new(24, "The passage suggests that researchers reject a purely biological explanation because _____", "Reading", "D",
            [
                new("A", "biology is unimportant"),
                new("B", "culture never changes"),
                new("C", "families always choose partners"),
                new("D", "social learning and past experiences also shape expectations")
            ], "Culture and Romance", cultureAndRomancePassage),
            new(25, "The best summary of the passage is that romantic behaviour _____", "Reading", "C",
            [
                new("A", "is identical in every culture"),
                new("B", "depends entirely on family pressure"),
                new("C", "is shaped by both society and individual background"),
                new("D", "cannot be studied scientifically")
            ], "Culture and Romance", cultureAndRomancePassage)
        ];
    }

    private sealed record PlacementQuestionDefinition(
        int Id,
        string Text,
        string Category,
        string CorrectOption,
        IReadOnlyList<PlacementOptionDefinition> Options,
        string? PassageTitle = null,
        string? PassageText = null);

    private sealed record PlacementOptionDefinition(string Key, string Text);
}
