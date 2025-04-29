using Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Database.Repository;

public class TadeoTDbContext(DbContextOptions<TadeoTDbContext> options) : DbContext(options)
{
    public DbSet<StopGroup> StopGroups { get; set; }
    public DbSet<StopGroupAssignment> StopGroupAssignments { get; set; }
    public DbSet<Stop> Stops { get; set; }
    public DbSet<Division> Divisions { get; set; }
    public DbSet<StopStatistic> StopStatistics { get; set; }
    public DbSet<Admin> Admins { get; set; }
    public DbSet<Student> Students { get; set; }
    public DbSet<Teacher> Teachers { get; set; }
    public DbSet<StudentAssignment> StudentAssignments { get; set; }
    public DbSet<TeacherAssignment> TeacherAssignments { get; set; }
    public DbSet<FeedbackQuestion> FeedbackQuestions { get; set; }
    public DbSet<FeedbackQuestionAnswer> FeedbackQuestionAnswers { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FeedbackQuestion>()
            .HasMany(q => q.FeedbackQuestionAnswers)
            .WithOne(a => a.FeedbackQuestion)
            .HasForeignKey(a => a.FeedbackQuestionId)
            .OnDelete(DeleteBehavior.Cascade);
        
    }
}
