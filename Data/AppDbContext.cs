using Backend.Models.Entities;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Backend.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IUnitOfWork
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<Scenario> Scenarios => Set<Scenario>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<UserMistake> UserMistakes => Set<UserMistake>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public Task<IAppTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default) =>
        BeginTransactionInternalAsync(cancellationToken);

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        base.SaveChangesAsync(cancellationToken);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(x => x.LastName).IsRequired().HasMaxLength(100);
            entity.Property(x => x.Email).IsRequired().HasMaxLength(256);
            entity.Property(x => x.PasswordHash).IsRequired();
            entity.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<Question>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Text).IsRequired().HasMaxLength(500);
        });

        modelBuilder.Entity<Scenario>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.GroupKey).IsRequired().HasMaxLength(100);
            entity.Property(x => x.GroupName).IsRequired().HasMaxLength(200);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(200);
            entity.Property(x => x.PromptKey).IsRequired().HasMaxLength(100);
            entity.Property(x => x.OrderIndex).IsRequired();
        });

        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Score).HasPrecision(5, 2);
            entity.Property(x => x.LastProgressJson).HasMaxLength(131072);
            entity.Property(x => x.SummaryReport).HasMaxLength(12000);
            entity.HasOne(x => x.User).WithMany(x => x.Sessions).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Scenario).WithMany(x => x.Sessions).HasForeignKey(x => x.ScenarioId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UserMistake>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ErrorType).IsRequired().HasMaxLength(100);
            entity.Property(x => x.WrongSentence).IsRequired().HasMaxLength(1000);
            entity.Property(x => x.CorrectionText).IsRequired().HasMaxLength(1000);
            entity.Property(x => x.WhyWrong).HasMaxLength(2000);
            entity.Property(x => x.TeachingTip).HasMaxLength(2000);
            entity.HasOne(x => x.Session).WithMany(x => x.Mistakes).HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.TokenHash).IsRequired().HasMaxLength(200);
            entity.HasIndex(x => x.TokenHash).IsUnique();
            entity.HasOne(x => x.User).WithMany(x => x.RefreshTokens).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });
    }

    private async Task<IAppTransaction> BeginTransactionInternalAsync(CancellationToken cancellationToken)
    {
        var transaction = await Database.BeginTransactionAsync(cancellationToken);
        return new EfAppTransaction(transaction);
    }

    private sealed class EfAppTransaction(IDbContextTransaction transaction) : IAppTransaction
    {
        public Task CommitAsync(CancellationToken cancellationToken = default) => transaction.CommitAsync(cancellationToken);
        public Task RollbackAsync(CancellationToken cancellationToken = default) => transaction.RollbackAsync(cancellationToken);
        public ValueTask DisposeAsync() => transaction.DisposeAsync();
    }
}



