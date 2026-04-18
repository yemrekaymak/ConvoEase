namespace Backend.Common;

public sealed class UnauthorizedException(string message) : AppException(message, 401);



