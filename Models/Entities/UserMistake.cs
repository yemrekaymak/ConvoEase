namespace Backend.Models.Entities;

public sealed class UserMistake
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public string ErrorType { get; set; } = string.Empty;
    public string WrongSentence { get; set; } = string.Empty;
    public string CorrectionText { get; set; } = string.Empty;
    public UserSession Session { get; set; } = null!;
}



