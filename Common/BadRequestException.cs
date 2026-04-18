namespace Backend.Common;

public sealed class BadRequestException(string message) : AppException(message, 400);



