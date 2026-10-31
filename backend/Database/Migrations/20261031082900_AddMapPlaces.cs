using Database.Repository;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Database.Migrations
{
    /// <inheritdoc />
    public partial class AddMapPlaces : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MapPlaces",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Floor = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    X = table.Column<double>(type: "double precision", nullable: false),
                    Y = table.Column<double>(type: "double precision", nullable: false),
                    PublicLabel = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Icon = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapPlaces", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MapPlaceStop",
                columns: table => new
                {
                    MapPlacesId = table.Column<int>(type: "integer", nullable: false),
                    StopsId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapPlaceStop", x => new { x.MapPlacesId, x.StopsId });
                    table.ForeignKey(
                        name: "FK_MapPlaceStop_MapPlaces_MapPlacesId",
                        column: x => x.MapPlacesId,
                        principalTable: "MapPlaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MapPlaceStop_Stops_StopsId",
                        column: x => x.StopsId,
                        principalTable: "Stops",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MapPlaces_Code",
                table: "MapPlaces",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MapPlaceStop_StopsId",
                table: "MapPlaceStop",
                column: "StopsId");

            foreach (var place in MapPlaceSeed.Places)
            {
                migrationBuilder.InsertData(
                    table: "MapPlaces",
                    columns: ["Floor", "Code", "Name", "X", "Y", "PublicLabel", "Icon"],
                    values: new object[] { place.Floor, place.Code, place.Name, place.X, place.Y, place.PublicLabel, place.Icon });
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MapPlaceStop");

            migrationBuilder.DropTable(
                name: "MapPlaces");
        }
    }
}
