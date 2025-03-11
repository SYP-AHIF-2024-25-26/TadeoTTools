﻿// <auto-generated />
using System;
using Database.Repository;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace database.Migrations
{
    [DbContext(typeof(TadeoTDbContext))]
    partial class TadeoTDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "8.0.13")
                .HasAnnotation("Relational:MaxIdentifierLength", 64);

            MySqlModelBuilderExtensions.AutoIncrementColumns(modelBuilder);

            modelBuilder.Entity("Database.Entities.Admin", b =>
                {
                    b.Property<string>("Id")
                        .HasColumnType("varchar(255)");

                    b.HasKey("Id");

                    b.HasIndex("Id")
                        .IsUnique();

                    b.ToTable("Admins");
                });

            modelBuilder.Entity("Database.Entities.Division", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    MySqlPropertyBuilderExtensions.UseMySqlIdentityColumn(b.Property<int>("Id"));

                    b.Property<string>("Color")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.Property<byte[]>("Image")
                        .HasColumnType("MEDIUMBLOB");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("varchar(255)");

                    b.HasKey("Id");

                    b.HasIndex("Name")
                        .IsUnique();

                    b.ToTable("Divisions");
                });

            modelBuilder.Entity("Database.Entities.Stop", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    MySqlPropertyBuilderExtensions.UseMySqlIdentityColumn(b.Property<int>("Id"));

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("varchar(255)");

                    b.Property<string>("RoomNr")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.Property<string>("StudentEdufsUsername")
                        .HasColumnType("varchar(255)");

                    b.Property<string>("TeacherEdufsUsername")
                        .HasColumnType("varchar(255)");

                    b.HasKey("Id");

                    b.HasIndex("Name")
                        .IsUnique();

                    b.HasIndex("StudentEdufsUsername");

                    b.HasIndex("TeacherEdufsUsername");

                    b.ToTable("Stops");
                });

            modelBuilder.Entity("Database.Entities.StopGroup", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    MySqlPropertyBuilderExtensions.UseMySqlIdentityColumn(b.Property<int>("Id"));

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.Property<bool>("IsPublic")
                        .HasColumnType("tinyint(1)");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("varchar(255)");

                    b.Property<int>("Rank")
                        .HasColumnType("int");

                    b.HasKey("Id");

                    b.HasIndex("Name")
                        .IsUnique();

                    b.ToTable("StopGroups");
                });

            modelBuilder.Entity("Database.Entities.StopGroupAssignment", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    MySqlPropertyBuilderExtensions.UseMySqlIdentityColumn(b.Property<int>("Id"));

                    b.Property<int>("Order")
                        .HasColumnType("int");

                    b.Property<int>("StopGroupId")
                        .HasColumnType("int");

                    b.Property<int>("StopId")
                        .HasColumnType("int");

                    b.HasKey("Id");

                    b.HasIndex("StopGroupId");

                    b.HasIndex("StopId");

                    b.ToTable("StopGroupAssignments");
                });

            modelBuilder.Entity("Database.Entities.StopStatistic", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    MySqlPropertyBuilderExtensions.UseMySqlIdentityColumn(b.Property<int>("Id"));

                    b.Property<bool>("IsDone")
                        .HasColumnType("tinyint(1)");

                    b.Property<int>("StopId")
                        .HasColumnType("int");

                    b.Property<DateTime>("Time")
                        .HasColumnType("datetime(6)");

                    b.HasKey("Id");

                    b.HasIndex("StopId");

                    b.ToTable("StopStatistics");
                });

            modelBuilder.Entity("Database.Entities.Student", b =>
                {
                    b.Property<string>("EdufsUsername")
                        .HasColumnType("varchar(255)");

                    b.Property<string>("Department")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.Property<string>("FirstName")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.Property<string>("LastName")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.Property<string>("StudentClass")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.HasKey("EdufsUsername");

                    b.ToTable("Students");
                });

            modelBuilder.Entity("Database.Entities.StudentAssignment", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    MySqlPropertyBuilderExtensions.UseMySqlIdentityColumn(b.Property<int>("Id"));

                    b.Property<int>("Status")
                        .HasColumnType("int");

                    b.Property<int>("StopId")
                        .HasColumnType("int");

                    b.Property<string>("StudentEdufsUsername")
                        .IsRequired()
                        .HasColumnType("varchar(255)");

                    b.Property<int>("StudentId")
                        .HasColumnType("int");

                    b.HasKey("Id");

                    b.HasIndex("StopId");

                    b.HasIndex("StudentEdufsUsername");

                    b.ToTable("StudentAssignments");
                });

            modelBuilder.Entity("Database.Entities.Teacher", b =>
                {
                    b.Property<string>("EdufsUsername")
                        .HasColumnType("varchar(255)");

                    b.Property<string>("FirstName")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.Property<string>("LastName")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.HasKey("EdufsUsername");

                    b.ToTable("Teachers");
                });

            modelBuilder.Entity("DivisionStop", b =>
                {
                    b.Property<int>("DivisionsId")
                        .HasColumnType("int");

                    b.Property<int>("StopsId")
                        .HasColumnType("int");

                    b.HasKey("DivisionsId", "StopsId");

                    b.HasIndex("StopsId");

                    b.ToTable("DivisionStop");
                });

            modelBuilder.Entity("Database.Entities.Stop", b =>
                {
                    b.HasOne("Database.Entities.Student", null)
                        .WithMany("Stops")
                        .HasForeignKey("StudentEdufsUsername");

                    b.HasOne("Database.Entities.Teacher", null)
                        .WithMany("Stops")
                        .HasForeignKey("TeacherEdufsUsername");
                });

            modelBuilder.Entity("Database.Entities.StopGroupAssignment", b =>
                {
                    b.HasOne("Database.Entities.StopGroup", "StopGroup")
                        .WithMany("StopAssignments")
                        .HasForeignKey("StopGroupId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("Database.Entities.Stop", "Stop")
                        .WithMany("StopGroupAssignments")
                        .HasForeignKey("StopId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Stop");

                    b.Navigation("StopGroup");
                });

            modelBuilder.Entity("Database.Entities.StopStatistic", b =>
                {
                    b.HasOne("Database.Entities.Stop", "Stop")
                        .WithMany("Statistics")
                        .HasForeignKey("StopId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Stop");
                });

            modelBuilder.Entity("Database.Entities.StudentAssignment", b =>
                {
                    b.HasOne("Database.Entities.Stop", "Stop")
                        .WithMany("StudentAssignments")
                        .HasForeignKey("StopId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("Database.Entities.Student", "Student")
                        .WithMany("StudentAssignments")
                        .HasForeignKey("StudentEdufsUsername")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Stop");

                    b.Navigation("Student");
                });

            modelBuilder.Entity("DivisionStop", b =>
                {
                    b.HasOne("Database.Entities.Division", null)
                        .WithMany()
                        .HasForeignKey("DivisionsId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("Database.Entities.Stop", null)
                        .WithMany()
                        .HasForeignKey("StopsId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Database.Entities.Stop", b =>
                {
                    b.Navigation("Statistics");

                    b.Navigation("StopGroupAssignments");

                    b.Navigation("StudentAssignments");
                });

            modelBuilder.Entity("Database.Entities.StopGroup", b =>
                {
                    b.Navigation("StopAssignments");
                });

            modelBuilder.Entity("Database.Entities.Student", b =>
                {
                    b.Navigation("Stops");

                    b.Navigation("StudentAssignments");
                });

            modelBuilder.Entity("Database.Entities.Teacher", b =>
                {
                    b.Navigation("Stops");
                });
#pragma warning restore 612, 618
        }
    }
}
