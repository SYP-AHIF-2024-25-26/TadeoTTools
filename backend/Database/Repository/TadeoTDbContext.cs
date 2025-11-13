using Database.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Database.Repository;

public class TadeoTDbContext(DbContextOptions<TadeoTDbContext> options) : DbContext(options)
{
    public DbSet<StopGroup> StopGroups { get; set; }
    public DbSet<StopGroupAssignment> StopGroupAssignments { get; set; }
    public DbSet<Stop> Stops { get; set; }
    public DbSet<Division> Divisions { get; set; }
    public DbSet<Admin> Admins { get; set; }
    public DbSet<Student> Students { get; set; }
    public DbSet<Teacher> Teachers { get; set; }
    public DbSet<StudentAssignment> StudentAssignments { get; set; }

    public DbSet<TeacherAssignment> TeacherAssignments { get; set; }
    public DbSet<FeedbackQuestion> FeedbackQuestions { get; set; }
    public DbSet<FeedbackQuestionAnswer> FeedbackQuestionAnswers { get; set; }

    public DbSet<FeedbackOption> FeedbackOptions { get; set; }
    public DbSet<FeedbackSession> FeedbackSessions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FeedbackQuestion>()
            .HasMany(q => q.FeedbackQuestionAnswers)
            .WithOne(a => a.FeedbackQuestion)
            .HasForeignKey(a => a.FeedbackQuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<FeedbackSession>()
            .HasMany(s => s.FeedbackQuestionAnswers)
            .WithOne(a => a.FeedbackSession)
            .HasForeignKey(a => a.FeedbackSessionId)
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