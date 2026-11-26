using System.Net;
using LabTrack.Domain.Entities;
using LabTrack.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;                        // ← ADDED: AsNoTracking, FirstOrDefaultAsync, FindAsync
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace LabTrack.Tests.Integration.Financial;

public class FinancialIntegrationTests : IAsyncLifetime
{
    private readonly HttpClient _client;
    private readonly LabTrackDbContext _dbContext;

    public FinancialIntegrationTests()
    {
        var provider = new ServiceCollection()
            .AddDbContext<LabTrackDbContext>(options =>
                options.UseInMemoryDatabase(Guid.NewGuid().ToString()))
            .BuildServiceProvider();

        _dbContext = provider.GetRequiredService<LabTrackDbContext>();
        _client = new HttpClient();
    }

    public async Task InitializeAsync()
    {
        await _dbContext.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await _dbContext.Database.EnsureDeletedAsync();
        await _dbContext.DisposeAsync();
        _client.Dispose();
    }

    [Fact]
    public async Task GetExpenseById_WhenExpenseExists_ReturnsExpenseWithDetails()
    {
        // Arrange
        var expenseId = Guid.NewGuid();
        var assetId = Guid.NewGuid();

        var expense = new FinancialExpense
        {
            Id = expenseId,
            AssetId = assetId,
            Amount = 450.75m,
            Category = "Hardware Upgrade",
            Description = "GPU Replacement for AI Station",
        };

        await _dbContext.FinancialExpenses.AddAsync(expense);
        await _dbContext.SaveChangesAsync();

        // Act
        var fetchedExpense = await _dbContext.FinancialExpenses
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == expenseId);

        // Assert
        Assert.NotNull(fetchedExpense);
        Assert.Equal(expenseId, fetchedExpense.Id);
        Assert.Equal(450.75m, fetchedExpense.Amount);
        Assert.Equal("Hardware Upgrade", fetchedExpense.Category);
    }

    [Fact]
    public async Task CreateFinancialExpense_WithValidData_PersistsExpenseInDatabase()
    {
        // Arrange
        var expense = new FinancialExpense
        {
            Id = Guid.NewGuid(),
            Amount = 1200.00m,
            Category = "Maintenance",
            Description = "Annual Server Rack Servicing",
        };

        // Act
        await _dbContext.FinancialExpenses.AddAsync(expense);
        var affectedRows = await _dbContext.SaveChangesAsync();

        var persistedExpense = await _dbContext.FinancialExpenses
            .FirstOrDefaultAsync(e => e.Id == expense.Id);

        // Assert
        Assert.Equal(1, affectedRows);
        Assert.NotNull(persistedExpense);
        Assert.Equal(1200.00m, persistedExpense.Amount);
        Assert.Equal("Maintenance", persistedExpense.Category);
    }

    [Fact]
    public async Task GetExpensesByDateRange_FiltersExpenseRecordsAccurately()
    {
        var baseDate = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);

        var expenses = new List<FinancialExpense>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Amount = 150.00m,
                Category = "Peripherals",
                ExpenseDateUtc = baseDate.AddDays(2)
            },
            new()
            {
                Id = Guid.NewGuid(),
                Amount = 300.00m,
                Category = "Network",
                ExpenseDateUtc = baseDate.AddDays(10)
            },
            new()
            {
                Id = Guid.NewGuid(),
                Amount = 500.00m,
                Category = "Licensing",
                ExpenseDateUtc = baseDate.AddDays(25)
            }
        };

        await _dbContext.FinancialExpenses.AddRangeAsync(expenses);
        await _dbContext.SaveChangesAsync();

        var startDate = baseDate;
        var endDate = baseDate.AddDays(15);

        // Act
        var filteredExpenses = await _dbContext.FinancialExpenses
            .Where(e => e.ExpenseDateUtc >= startDate && e.ExpenseDateUtc <= endDate)
            .AsNoTracking()
            .ToListAsync();

        // Assert
        Assert.Equal(2, filteredExpenses.Count);
        Assert.All(filteredExpenses, e =>
            Assert.True(e.ExpenseDateUtc >= startDate && e.ExpenseDateUtc <= endDate));
    }

    [Fact]
    public async Task DeleteExpense_WhenExists_RemovesFromDatabase()
    {
        // Arrange
        var expenseId = Guid.NewGuid();
        var expense = new FinancialExpense
        {
            Id = expenseId,
            Amount = 85.50m,
            Category = "Cable Replacement",
        };

        await _dbContext.FinancialExpenses.AddAsync(expense);
        await _dbContext.SaveChangesAsync();

        // Act
        _dbContext.FinancialExpenses.Remove(expense);
        await _dbContext.SaveChangesAsync();

        var deletedExpense = await _dbContext.FinancialExpenses.FindAsync(expenseId);

        // Assert
        Assert.Null(deletedExpense);
    }
}
