using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace istockBack.Migrations
{
    /// <inheritdoc />
    public partial class AddCodigoBarraEnProducto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "codigoBarra",
                table: "Producto",
                type: "varchar(64)",
                unicode: false,
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "UX_Producto_CodigoBarra",
                table: "Producto",
                column: "codigoBarra",
                unique: true,
                filter: "[codigoBarra] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_Producto_CodigoBarra",
                table: "Producto");

            migrationBuilder.DropColumn(
                name: "codigoBarra",
                table: "Producto");
        }
    }
}
