using Database.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Database.Repository;

public class TadeoTDbContext(DbContextOptions<TadeoTDbContext> options) : DbContext(options)
{
    public DbSet<StopGroup> StopGroups => Set<StopGroup>();
    public DbSet<StopGroupAssignment> StopGroupAssignments => Set<StopGroupAssignment>();
    public DbSet<Stop> Stops => Set<Stop>();
    public DbSet<Division> Divisions => Set<Division>();
    public DbSet<Admin> Admins => Set<Admin>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<StopManager> StopManagers => Set<StopManager>();
    public DbSet<StudentAssignment> StudentAssignments => Set<StudentAssignment>();

    public DbSet<StopManagerAssignment> StopManagerAssignments => Set<StopManagerAssignment>();
    public DbSet<FeedbackQuestion> FeedbackQuestions => Set<FeedbackQuestion>();
    public DbSet<FeedbackTextQuestion> FeedbackTextQuestions => Set<FeedbackTextQuestion>();
    public DbSet<FeedbackRatingQuestion> FeedbackRatingQuestions => Set<FeedbackRatingQuestion>();
    public DbSet<FeedbackChoiceQuestion> FeedbackChoiceQuestions => Set<FeedbackChoiceQuestion>();

    public DbSet<FeedbackQuestionAnswer> FeedbackQuestionAnswers => Set<FeedbackQuestionAnswer>();
    public DbSet<FeedbackDependency> FeedbackDependencies => Set<FeedbackDependency>();

    public DbSet<FeedbackOption> FeedbackOptions => Set<FeedbackOption>();
    public DbSet<FeedbackSession> FeedbackSessions => Set<FeedbackSession>();
    public DbSet<FeatureFlag> FeatureFlags => Set<FeatureFlag>();

    public DbSet<Buffet> Buffets => Set<Buffet>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<BuffetProduct> BuffetProducts => Set<BuffetProduct>();
    public DbSet<CashMovement> CashMovements => Set<CashMovement>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FeedbackQuestion>()
            .HasMany(q => q.FeedbackQuestionAnswers)
            .WithOne(a => a.FeedbackQuestion)
            .HasForeignKey(a => a.FeedbackQuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<FeedbackDependency>()
            .HasOne(d => d.Question)
            .WithMany(q => q.Dependencies)
            .HasForeignKey(d => d.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<FeedbackDependency>()
            .HasOne(d => d.DependsOnQuestion)
            .WithMany()
            .HasForeignKey(d => d.DependsOnQuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<FeedbackSession>()
            .HasMany(s => s.FeedbackQuestionAnswers)
            .WithOne(a => a.FeedbackSession)
            .HasForeignKey(a => a.FeedbackSessionId)
            .OnDelete(DeleteBehavior.Cascade);

        // A buffet or product with sales or cash movements stays; the endpoints say why.
        modelBuilder.Entity<Buffet>()
            .HasMany(b => b.Menu)
            .WithOne(m => m.Buffet)
            .HasForeignKey(m => m.BuffetId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Buffet>()
            .HasMany(b => b.CashMovements)
            .WithOne(c => c.Buffet)
            .HasForeignKey(c => c.BuffetId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Buffet>()
            .HasMany(b => b.Orders)
            .WithOne(o => o.Buffet)
            .HasForeignKey(o => o.BuffetId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Product>()
            .HasMany(p => p.BuffetProducts)
            .WithOne(m => m.Product)
            .HasForeignKey(m => m.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Product>()
            .HasMany(p => p.OrderItems)
            .WithOne(i => i.Product)
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Order>()
            .HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    public override int SaveChanges()
    {
        TrimStringsBeforeInsert();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        TrimStringsBeforeInsert();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void TrimStringsBeforeInsert()
    {
        foreach (var entry in ChangeTracker.Entries().Where(e => e.State == EntityState.Added || e.State == EntityState.Modified))
        {
            TrimStringProperties(entry);
        }
    }

    private static void TrimStringProperties(EntityEntry entry)
    {
        foreach (var property in entry.Properties)
        {
            if (property.Metadata.ClrType == typeof(string))
            {
                var currentValue = (string?)property.CurrentValue;
                if (currentValue != null)
                {
                    var trimmed = currentValue.Trim();
                    if (!ReferenceEquals(currentValue, trimmed))
                    {
                        property.CurrentValue = trimmed;
                    }
                }
            }
        }
    }
}