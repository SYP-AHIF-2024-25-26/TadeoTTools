using System;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace Database.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Admins",
                columns: table => new
                {
                    Id = table.Column<string>(type: "varchar(255)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Admins", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Divisions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(255)", nullable: false),
                    Color = table.Column<string>(type: "longtext", nullable: false),
                    Image = table.Column<byte[]>(type: "MEDIUMBLOB", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Divisions", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "FeedbackQuestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Question = table.Column<string>(type: "longtext", nullable: false),
                    Type = table.Column<string>(type: "longtext", nullable: false),
                    Required = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Placeholder = table.Column<string>(type: "longtext", nullable: true),
                    MinRating = table.Column<int>(type: "int", nullable: true),
                    MaxRating = table.Column<int>(type: "int", nullable: true),
                    RatingLabels = table.Column<string>(type: "longtext", nullable: true),
                    Order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedbackQuestions", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "FeedbackSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Timestamp = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedbackSessions", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "StopGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Rank = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "varchar(255)", nullable: false),
                    Description = table.Column<string>(type: "longtext", nullable: false),
                    IsPublic = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StopGroups", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Stops",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(255)", nullable: false),
                    Description = table.Column<string>(type: "longtext", nullable: false),
                    RoomNr = table.Column<string>(type: "longtext", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stops", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Students",
                columns: table => new
                {
                    EdufsUsername = table.Column<string>(type: "varchar(255)", nullable: false),
                    FirstName = table.Column<string>(type: "longtext", nullable: false),
                    LastName = table.Column<string>(type: "longtext", nullable: false),
                    StudentClass = table.Column<string>(type: "longtext", nullable: false),
                    Department = table.Column<string>(type: "longtext", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Students", x => x.EdufsUsername);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Teachers",
                columns: table => new
                {
                    EdufsUsername = table.Column<string>(type: "varchar(255)", nullable: false),
                    FirstName = table.Column<string>(type: "longtext", nullable: false),
                    LastName = table.Column<string>(type: "longtext", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teachers", x => x.EdufsUsername);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "FeedbackOptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Value = table.Column<string>(type: "longtext", nullable: false),
                    FeedbackQuestionId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedbackOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FeedbackOptions_FeedbackQuestions_FeedbackQuestionId",
                        column: x => x.FeedbackQuestionId,
                        principalTable: "FeedbackQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "FeedbackQuestionAnswers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Answer = table.Column<string>(type: "longtext", nullable: false),
                    FeedbackQuestionId = table.Column<int>(type: "int", nullable: false),
                    FeedbackSessionId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedbackQuestionAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FeedbackQuestionAnswers_FeedbackQuestions_FeedbackQuestionId",
                        column: x => x.FeedbackQuestionId,
                        principalTable: "FeedbackQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FeedbackQuestionAnswers_FeedbackSessions_FeedbackSessionId",
                        column: x => x.FeedbackSessionId,
                        principalTable: "FeedbackSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "DivisionStop",
                columns: table => new
                {
                    DivisionsId = table.Column<int>(type: "int", nullable: false),
                    StopsId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DivisionStop", x => new { x.DivisionsId, x.StopsId });
                    table.ForeignKey(
                        name: "FK_DivisionStop_Divisions_DivisionsId",
                        column: x => x.DivisionsId,
                        principalTable: "Divisions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DivisionStop_Stops_StopsId",
                        column: x => x.StopsId,
                        principalTable: "Stops",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "StopGroupAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    StopId = table.Column<int>(type: "int", nullable: false),
                    StopGroupId = table.Column<int>(type: "int", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StopGroupAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StopGroupAssignments_StopGroups_StopGroupId",
                        column: x => x.StopGroupId,
                        principalTable: "StopGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StopGroupAssignments_Stops_StopId",
                        column: x => x.StopId,
                        principalTable: "Stops",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "StudentAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    StudentId = table.Column<string>(type: "varchar(255)", nullable: false),
                    StopId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentAssignments_Stops_StopId",
                        column: x => x.StopId,
                        principalTable: "Stops",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentAssignments_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "EdufsUsername",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "TeacherAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    TeacherId = table.Column<string>(type: "varchar(255)", nullable: false),
                    StopId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeacherAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TeacherAssignments_Stops_StopId",
                        column: x => x.StopId,
                        principalTable: "Stops",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TeacherAssignments_Teachers_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "Teachers",
                        principalColumn: "EdufsUsername",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Admins_Id",
                table: "Admins",
                column: "Id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Divisions_Name",
                table: "Divisions",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DivisionStop_StopsId",
                table: "DivisionStop",
                column: "StopsId");

            migrationBuilder.CreateIndex(
                name: "IX_FeedbackOptions_FeedbackQuestionId",
                table: "FeedbackOptions",
                column: "FeedbackQuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_FeedbackQuestionAnswers_FeedbackQuestionId",
                table: "FeedbackQuestionAnswers",
                column: "FeedbackQuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_FeedbackQuestionAnswers_FeedbackSessionId",
                table: "FeedbackQuestionAnswers",
                column: "FeedbackSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_StopGroupAssignments_StopGroupId",
                table: "StopGroupAssignments",
                column: "StopGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_StopGroupAssignments_StopId",
                table: "StopGroupAssignments",
                column: "StopId");

            migrationBuilder.CreateIndex(
                name: "IX_StopGroups_Name",
                table: "StopGroups",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Stops_Name",
                table: "Stops",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentAssignments_StopId",
                table: "StudentAssignments",
                column: "StopId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentAssignments_StudentId",
                table: "StudentAssignments",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherAssignments_StopId",
                table: "TeacherAssignments",
                column: "StopId");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherAssignments_TeacherId",
                table: "TeacherAssignments",
                column: "TeacherId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Admins");

            migrationBuilder.DropTable(
                name: "DivisionStop");

            migrationBuilder.DropTable(
                name: "FeedbackOptions");

            migrationBuilder.DropTable(
                name: "FeedbackQuestionAnswers");

            migrationBuilder.DropTable(
                name: "StopGroupAssignments");

            migrationBuilder.DropTable(
                name: "StudentAssignments");

            migrationBuilder.DropTable(
                name: "TeacherAssignments");

            migrationBuilder.DropTable(
                name: "Divisions");

            migrationBuilder.DropTable(
                name: "FeedbackQuestions");

            migrationBuilder.DropTable(
                name: "FeedbackSessions");

            migrationBuilder.DropTable(
                name: "StopGroups");

            migrationBuilder.DropTable(
                name: "Students");

            migrationBuilder.DropTable(
                name: "Stops");

            migrationBuilder.DropTable(
                name: "Teachers");
        }
    }
}
