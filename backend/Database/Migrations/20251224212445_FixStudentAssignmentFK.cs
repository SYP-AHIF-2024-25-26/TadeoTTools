using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Database.Migrations
{
    /// <inheritdoc />
    public partial class FixStudentAssignmentFK : Migration
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

            migrationBuilder.CreateIndex(
                name: "IX_StudentAssignments_EdufsUsername",
                table: "StudentAssignments",
                column: "EdufsUsername");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentAssignments_Students_EdufsUsername",
                table: "StudentAssignments",
                column: "EdufsUsername",
                principalTable: "Students",
                principalColumn: "EdufsUsername",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudentAssignments_Students_EdufsUsername",
                table: "StudentAssignments");

            migrationBuilder.DropIndex(
                name: "IX_StudentAssignments_EdufsUsername",
                table: "StudentAssignments");

            migrationBuilder.AddColumn<string>(
                name: "StudentEdufsUsername",
                table: "StudentAssignments",
                type: "character varying(100)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentAssignments_StudentEdufsUsername",
                table: "StudentAssignments",
                column: "StudentEdufsUsername");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentAssignments_Students_StudentEdufsUsername",
                table: "StudentAssignments",
                column: "StudentEdufsUsername",
                principalTable: "Students",
                principalColumn: "EdufsUsername");
        }
    }
}
