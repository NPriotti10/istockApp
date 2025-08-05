using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace istockBack.Migrations
{
    /// <inheritdoc />
    public partial class AddCamposVentaExtras : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "VentaIdVenta",
                table: "ItemVenta",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ItemVenta_VentaIdVenta",
                table: "ItemVenta",
                column: "VentaIdVenta");

            migrationBuilder.AddForeignKey(
                name: "FK_ItemVenta_Venta_VentaIdVenta",
                table: "ItemVenta",
                column: "VentaIdVenta",
                principalTable: "Venta",
                principalColumn: "idVenta");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ItemVenta_Venta_VentaIdVenta",
                table: "ItemVenta");

            migrationBuilder.DropIndex(
                name: "IX_ItemVenta_VentaIdVenta",
                table: "ItemVenta");

            migrationBuilder.DropColumn(
                name: "VentaIdVenta",
                table: "ItemVenta");
        }
    }
}
