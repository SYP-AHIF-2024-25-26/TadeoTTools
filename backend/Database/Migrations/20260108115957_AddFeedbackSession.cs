using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Database.Migrations
{
    /// <inheritdoc />
    public partial class AddFeedbackSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FeedbackSessionId",
                table: "FeedbackQuestionAnswers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "FeedbackSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedbackSessions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FeedbackQuestionAnswers_FeedbackSessionId",
                table: "FeedbackQuestionAnswers",
                column: "FeedbackSessionId");

            migrationBuilder.AddForeignKey(
                name: "FK_FeedbackQuestionAnswers_FeedbackSessions_FeedbackSessionId",
                table: "FeedbackQuestionAnswers",
                column: "FeedbackSessionId",
                principalTable: "FeedbackSessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FeedbackQuestionAnswers_FeedbackSessions_FeedbackSessionId",
                table: "FeedbackQuestionAnswers");

            migrationBuilder.DropTable(
                name: "FeedbackSessions");

            migrationBuilder.DropIndex(
                name: "IX_FeedbackQuestionAnswers_FeedbackSessionId",
                table: "FeedbackQuestionAnswers");

            migrationBuilder.DropColumn(
                name: "FeedbackSessionId",
                table: "FeedbackQuestionAnswers");
        }
    }
}
