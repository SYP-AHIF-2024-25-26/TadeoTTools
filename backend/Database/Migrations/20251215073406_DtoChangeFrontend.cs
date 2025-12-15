using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Database.Migrations
{
    /// <inheritdoc />
    public partial class DtoChangeFrontend : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudentAssignments_Students_StudentId",
                table: "StudentAssignments");

            migrationBuilder.DropIndex(
                name: "IX_StudentAssignments_StudentId",
                table: "StudentAssignments");

            migrationBuilder.RenameColumn(
                name: "StudentId",
                table: "StudentAssignments",
                newName: "EdufsUsername");

            migrationBuilder.RenameColumn(
                name: "Rank",
                table: "StopGroups",
                newName: "Order");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.RenameColumn(
                name: "EdufsUsername",
                table: "StudentAssignments",
                newName: "StudentId");

            migrationBuilder.RenameColumn(
                name: "Order",
                table: "StopGroups",
                newName: "Rank");

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
    }
}
