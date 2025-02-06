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
}
