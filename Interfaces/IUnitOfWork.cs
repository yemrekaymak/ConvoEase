namespace Backend.Interfaces;

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<IAppTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
}



