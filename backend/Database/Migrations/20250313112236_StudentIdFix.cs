using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace database.Migrations
{
    /// <inheritdoc />
    public partial class StudentIdFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudentAssignments_Students_StudentEdufsUsername",
                table: "StudentAssignments");

            migrationBuilder.DropIndex(
                name: "IX_StudentAssignments_StudentEdufsUsername",
                table: "StudentAssignments");

            migrationBuilder.DropColumn(
                name: "StudentEdufsUsername",
                table: "StudentAssignments");

            migrationBuilder.AlterColumn<string>(
                name: "StudentId",
                table: "StudentAssignments",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_StudentAssignments_StudentId",
                table: "StudentAssignments",
                column: "StudentId");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentAssignments_Students_StudentId",
                table: "StudentAssignments",
                column: "StudentId",
                principalTable: "Students",
                principalColumn: "EdufsUsername",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudentAssignments_Students_StudentId",
                table: "StudentAssignments");

            migrationBuilder.DropIndex(
                name: "IX_StudentAssignments_StudentId",
                table: "StudentAssignments");

            migrationBuilder.AlterColumn<int>(
                name: "StudentId",
                table: "StudentAssignments",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "StudentEdufsUsername",
                table: "StudentAssignments",
                type: "varchar(255)",
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_StudentAssignments_StudentEdufsUsername",
                table: "StudentAssignments",
                column: "StudentEdufsUsername");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentAssignments_Students_StudentEdufsUsername",
                table: "StudentAssignments",
                column: "StudentEdufsUsername",
                principalTable: "Students",
                principalColumn: "EdufsUsername",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
