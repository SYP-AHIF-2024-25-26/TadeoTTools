using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace database.Migrations
{
    /// <inheritdoc />
    public partial class TeacherIdFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TeacherAssignments_Teachers_TeacherEdufsUsername",
                table: "TeacherAssignments");

            migrationBuilder.DropIndex(
                name: "IX_TeacherAssignments_TeacherEdufsUsername",
                table: "TeacherAssignments");

            migrationBuilder.DropColumn(
                name: "TeacherEdufsUsername",
                table: "TeacherAssignments");

            migrationBuilder.AlterColumn<string>(
                name: "TeacherId",
                table: "TeacherAssignments",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherAssignments_TeacherId",
                table: "TeacherAssignments",
                column: "TeacherId");

            migrationBuilder.AddForeignKey(
                name: "FK_TeacherAssignments_Teachers_TeacherId",
                table: "TeacherAssignments",
                column: "TeacherId",
                principalTable: "Teachers",
                principalColumn: "EdufsUsername",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TeacherAssignments_Teachers_TeacherId",
                table: "TeacherAssignments");

            migrationBuilder.DropIndex(
                name: "IX_TeacherAssignments_TeacherId",
                table: "TeacherAssignments");

            migrationBuilder.AlterColumn<int>(
                name: "TeacherId",
                table: "TeacherAssignments",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TeacherEdufsUsername",
                table: "TeacherAssignments",
                type: "varchar(255)",
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherAssignments_TeacherEdufsUsername",
                table: "TeacherAssignments",
                column: "TeacherEdufsUsername");

            migrationBuilder.AddForeignKey(
                name: "FK_TeacherAssignments_Teachers_TeacherEdufsUsername",
                table: "TeacherAssignments",
                column: "TeacherEdufsUsername",
                principalTable: "Teachers",
                principalColumn: "EdufsUsername",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
