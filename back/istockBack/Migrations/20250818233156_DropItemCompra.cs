using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace istockBack.Migrations
{
    /// <inheritdoc />
    public partial class DropItemCompra : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ItemCompra");

            migrationBuilder.RenameColumn(
                name: "PrecioTotal",
                table: "Compra",
                newName: "precioTotal");

            migrationBuilder.AlterColumn<DateTime>(
                name: "fecha",
                table: "Compra",
                type: "datetime",
                nullable: false,
                defaultValueSql: "GETDATE()",
                oldClrType: typeof(DateTime),
                oldType: "datetime",
                oldDefaultValueSql: "(getdate())");

            migrationBuilder.AddColumn<string>(
                name: "itemsJson",
                table: "Compra",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "itemsJson",
                table: "Compra");

            migrationBuilder.RenameColumn(
                name: "precioTotal",
                table: "Compra",
                newName: "PrecioTotal");

            migrationBuilder.AlterColumn<DateTime>(
                name: "fecha",
                table: "Compra",
                type: "datetime",
                nullable: false,
                defaultValueSql: "(getdate())",
                oldClrType: typeof(DateTime),
                oldType: "datetime",
                oldDefaultValueSql: "GETDATE()");

            migrationBuilder.CreateTable(
                name: "ItemCompra",
                columns: table => new
                {
                    idItemCompra = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    idCompra = table.Column<int>(type: "int", nullable: false),
                    idProducto = table.Column<int>(type: "int", nullable: false),
                    cantidad = table.Column<int>(type: "int", nullable: false),
                    CompraIdCompra = table.Column<int>(type: "int", nullable: true),
                    precioTotal = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    precioUnitario = table.Column<decimal>(type: "decimal(10,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemCompra", x => x.idItemCompra);
                    table.ForeignKey(
                        name: "FK_ItemCompra_Compra_CompraIdCompra",
                        column: x => x.CompraIdCompra,
                        principalTable: "Compra",
                        principalColumn: "idCompra");
                    table.ForeignKey(
                        name: "FK_ItemCompra_Compra_idCompra",
                        column: x => x.idCompra,
                        principalTable: "Compra",
                        principalColumn: "idCompra");
                    table.ForeignKey(
                        name: "FK_ItemCompra_Producto_idProducto",
                        column: x => x.idProducto,
                        principalTable: "Producto",
                        principalColumn: "idProducto");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ItemCompra_CompraIdCompra",
                table: "ItemCompra",
                column: "CompraIdCompra");

            migrationBuilder.CreateIndex(
                name: "IX_ItemCompra_idCompra",
                table: "ItemCompra",
                column: "idCompra");

            migrationBuilder.CreateIndex(
                name: "IX_ItemCompra_idProducto",
                table: "ItemCompra",
                column: "idProducto");
        }
    }
}
