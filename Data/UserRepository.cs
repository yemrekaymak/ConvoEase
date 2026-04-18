using Backend.Models.Entities;
using Backend.Interfaces;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public sealed class UserRepository(AppDbContext dbContext) : IUserRepository
{
    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        dbContext.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

    public Task<User?> GetByIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);

    public Task AddAsync(User user, CancellationToken cancellationToken = default) =>
        dbContext.Users.AddAsync(user, cancellationToken).AsTask();

    public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default) =>
        dbContext.Users.AnyAsync(x => x.Email == email, cancellationToken);
}



