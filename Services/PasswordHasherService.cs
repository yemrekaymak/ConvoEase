using Backend.Interfaces;
using Backend.Models.Entities;
using Microsoft.AspNetCore.Identity;

namespace Backend.Services;

public sealed class PasswordHasherService : IPasswordHasherService
{
    private readonly PasswordHasher<User> _passwordHasher = new();

    public string HashPassword(string password) =>
        _passwordHasher.HashPassword(new User(), password);

    public bool VerifyPassword(string hashedPassword, string providedPassword)
    {
        var result = _passwordHasher.VerifyHashedPassword(new User(), hashedPassword, providedPassword);
        return result is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
    }
}



