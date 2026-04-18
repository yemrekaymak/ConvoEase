namespace Backend.Common;

public sealed class NotFoundException(string message) : AppException(message, 404);



