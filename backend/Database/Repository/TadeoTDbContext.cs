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
    public DbSet<Teacher> Teachers => Set<Teacher>();
    public DbSet<StudentAssignment> StudentAssignments => Set<StudentAssignment>();

    public DbSet<TeacherAssignment> TeacherAssignments => Set<TeacherAssignment>();
    public DbSet<FeedbackQuestion> FeedbackQuestions => Set<FeedbackQuestion>();
    public DbSet<FeedbackTextQuestion> FeedbackTextQuestions => Set<FeedbackTextQuestion>();
    public DbSet<FeedbackRatingQuestion> FeedbackRatingQuestions => Set<FeedbackRatingQuestion>();
    public DbSet<FeedbackChoiceQuestion> FeedbackChoiceQuestions => Set<FeedbackChoiceQuestion>();

    public DbSet<FeedbackQuestionAnswer> FeedbackQuestionAnswers => Set<FeedbackQuestionAnswer>();
    public DbSet<FeedbackDependency> FeedbackDependencies => Set<FeedbackDependency>();

    public DbSet<FeedbackOption> FeedbackOptions => Set<FeedbackOption>();
    // public DbSet<FeedbackSession> FeedbackSessions => Set<FeedbackSession>();

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

        /*modelBuilder.Entity<FeedbackSession>()
            .HasMany(s => s.FeedbackQuestionAnswers)
            .WithOne(a => a.FeedbackSession)
            .HasForeignKey(a => a.FeedbackSessionId)
            .OnDelete(DeleteBehavior.Cascade);
            */
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