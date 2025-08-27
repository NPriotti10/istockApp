using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace istockBack.Migrations
{
    /// <inheritdoc />
    public partial class ItemVentaSnapshots_SetNullFK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ItemVenta_Producto_idProducto",
                table: "ItemVenta");

            migrationBuilder.DropForeignKey(
                name: "FK_ItemVenta_Venta_idVenta",
                table: "ItemVenta");

            migrationBuilder.RenameColumn(
                name: "NumeroSerie",
                table: "ItemVenta",
                newName: "numeroSerie");

            migrationBuilder.AlterColumn<decimal>(
                name: "precioUnitario",
                table: "ItemVenta",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(10,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "precioTotal",
                table: "ItemVenta",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(10,2)");

            migrationBuilder.AlterColumn<int>(
                name: "idProducto",
                table: "ItemVenta",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<decimal>(
                name: "ganancia",
                table: "ItemVenta",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(10,2)");

            migrationBuilder.AlterColumn<string>(
                name: "numeroSerie",
                table: "ItemVenta",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "categoriaNombre",
                table: "ItemVenta",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "codigoBarra",
                table: "ItemVenta",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "costoUnitario",
                table: "ItemVenta",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "nombreProducto",
                table: "ItemVenta",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ItemVenta_Producto_idProducto",
                table: "ItemVenta",
                column: "idProducto",
                principalTable: "Producto",
                principalColumn: "idProducto",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ItemVenta_Venta_idVenta",
                table: "ItemVenta",
                column: "idVenta",
                principalTable: "Venta",
                principalColumn: "idVenta",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ItemVenta_Producto_idProducto",
                table: "ItemVenta");

            migrationBuilder.DropForeignKey(
                name: "FK_ItemVenta_Venta_idVenta",
                table: "ItemVenta");

            migrationBuilder.DropColumn(
                name: "categoriaNombre",
                table: "ItemVenta");

            migrationBuilder.DropColumn(
                name: "codigoBarra",
                table: "ItemVenta");

            migrationBuilder.DropColumn(
                name: "costoUnitario",
                table: "ItemVenta");

            migrationBuilder.DropColumn(
                name: "nombreProducto",
                table: "ItemVenta");

            migrationBuilder.RenameColumn(
                name: "numeroSerie",
                table: "ItemVenta",
                newName: "NumeroSerie");

            migrationBuilder.AlterColumn<decimal>(
                name: "precioUnitario",
                table: "ItemVenta",
                type: "decimal(10,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "precioTotal",
                table: "ItemVenta",
                type: "decimal(10,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<string>(
                name: "NumeroSerie",
                table: "ItemVenta",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "idProducto",
                table: "ItemVenta",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "ganancia",
                table: "ItemVenta",
                type: "decimal(10,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AddForeignKey(
                name: "FK_ItemVenta_Producto_idProducto",
                table: "ItemVenta",
                column: "idProducto",
                principalTable: "Producto",
                principalColumn: "idProducto");

            migrationBuilder.AddForeignKey(
                name: "FK_ItemVenta_Venta_idVenta",
                table: "ItemVenta",
                column: "idVenta",
                principalTable: "Venta",
                principalColumn: "idVenta");
        }
    }
}
