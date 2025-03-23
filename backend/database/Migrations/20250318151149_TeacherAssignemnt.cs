using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace database.Migrations
{
    /// <inheritdoc />
    public partial class TeacherAssignemnt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Stops_Students_StudentEdufsUsername",
                table: "Stops");

            migrationBuilder.DropForeignKey(
                name: "FK_Stops_Teachers_TeacherEdufsUsername",
                table: "Stops");

            migrationBuilder.DropIndex(
                name: "IX_Stops_StudentEdufsUsername",
                table: "Stops");

            migrationBuilder.DropIndex(
                name: "IX_Stops_TeacherEdufsUsername",
                table: "Stops");

            migrationBuilder.DropColumn(
                name: "StudentEdufsUsername",
                table: "Stops");

            migrationBuilder.DropColumn(
                name: "TeacherEdufsUsername",
                table: "Stops");

            migrationBuilder.CreateTable(
                name: "TeacherAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TeacherId = table.Column<int>(type: "int", nullable: false),
                    TeacherEdufsUsername = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StopId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false)
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
                        name: "FK_TeacherAssignments_Teachers_TeacherEdufsUsername",
                        column: x => x.TeacherEdufsUsername,
                        principalTable: "Teachers",
                        principalColumn: "EdufsUsername",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherAssignments_StopId",
                table: "TeacherAssignments",
                column: "StopId");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherAssignments_TeacherEdufsUsername",
                table: "TeacherAssignments",
                column: "TeacherEdufsUsername");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TeacherAssignments");

            migrationBuilder.AddColumn<string>(
                name: "StudentEdufsUsername",
                table: "Stops",
                type: "varchar(255)",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TeacherEdufsUsername",
                table: "Stops",
                type: "varchar(255)",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Stops_StudentEdufsUsername",
                table: "Stops",
                column: "StudentEdufsUsername");

            migrationBuilder.CreateIndex(
                name: "IX_Stops_TeacherEdufsUsername",
                table: "Stops",
                column: "TeacherEdufsUsername");

            migrationBuilder.AddForeignKey(
                name: "FK_Stops_Students_StudentEdufsUsername",
                table: "Stops",
                column: "StudentEdufsUsername",
                principalTable: "Students",
                principalColumn: "EdufsUsername");

            migrationBuilder.AddForeignKey(
                name: "FK_Stops_Teachers_TeacherEdufsUsername",
                table: "Stops",
                column: "TeacherEdufsUsername",
                principalTable: "Teachers",
                principalColumn: "EdufsUsername");
        }
    }
}
