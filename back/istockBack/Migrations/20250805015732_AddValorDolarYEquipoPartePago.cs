using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace istockBack.Migrations
{
    /// <inheritdoc />
    public partial class AddValorDolarYEquipoPartePago : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categoria",
                columns: table => new
                {
                    idCategoria = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    nombre = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Categori__8A3D240C8DF57A7A", x => x.idCategoria);
                });

            migrationBuilder.CreateTable(
                name: "Proveedor",
                columns: table => new
                {
                    idProveedor = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    contacto = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    direccion = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Proveedo__A3FA8E6B1CD56ADC", x => x.idProveedor);
                });

            migrationBuilder.CreateTable(
                name: "Venta",
                columns: table => new
                {
                    idVenta = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    cliente = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    fecha = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    formaPago = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PrecioTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GananciaTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ValorDolar = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    EquipoPartePago = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Venta__077D56142EEBE7DC", x => x.idVenta);
                });

            migrationBuilder.CreateTable(
                name: "Producto",
                columns: table => new
                {
                    idProducto = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    nombre = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    descripcion = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    precioVenta = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    precioCosto = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    stockActual = table.Column<int>(type: "int", nullable: false),
                    stockMinimo = table.Column<int>(type: "int", nullable: false),
                    idCategoria = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Producto__07F4A13281069226", x => x.idProducto);
                    table.ForeignKey(
                        name: "FK_Producto_Categoria",
                        column: x => x.idCategoria,
                        principalTable: "Categoria",
                        principalColumn: "idCategoria");
                });

            migrationBuilder.CreateTable(
                name: "Compra",
                columns: table => new
                {
                    idCompra = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    idProveedor = table.Column<int>(type: "int", nullable: false),
                    precioCosto = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    fecha = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Compra__48B99DB7A18C3C77", x => x.idCompra);
                    table.ForeignKey(
                        name: "FK__Compra__idProvee__45F365D3",
                        column: x => x.idProveedor,
                        principalTable: "Proveedor",
                        principalColumn: "idProveedor");
                });

            migrationBuilder.CreateTable(
                name: "ItemVenta",
                columns: table => new
                {
                    idItemVenta = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    idVenta = table.Column<int>(type: "int", nullable: false),
                    idProducto = table.Column<int>(type: "int", nullable: false),
                    cantidad = table.Column<int>(type: "int", nullable: false),
                    precioUnitario = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    precioTotal = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    ganancia = table.Column<decimal>(type: "decimal(10,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemVenta", x => x.idItemVenta);
                    table.ForeignKey(
                        name: "FK_ItemVenta_Producto_idProducto",
                        column: x => x.idProducto,
                        principalTable: "Producto",
                        principalColumn: "idProducto");
                    table.ForeignKey(
                        name: "FK_ItemVenta_Venta_idVenta",
                        column: x => x.idVenta,
                        principalTable: "Venta",
                        principalColumn: "idVenta");
                });

            migrationBuilder.CreateTable(
                name: "ItemCompra",
                columns: table => new
                {
                    idItemCompra = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    idCompra = table.Column<int>(type: "int", nullable: false),
                    idProducto = table.Column<int>(type: "int", nullable: false),
                    cantidad = table.Column<int>(type: "int", nullable: false),
                    precioUnitario = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    precioTotal = table.Column<decimal>(type: "decimal(10,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemCompra", x => x.idItemCompra);
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
                name: "IX_Compra_idProveedor",
                table: "Compra",
                column: "idProveedor");

            migrationBuilder.CreateIndex(
                name: "IX_ItemCompra_idCompra",
                table: "ItemCompra",
                column: "idCompra");

            migrationBuilder.CreateIndex(
                name: "IX_ItemCompra_idProducto",
                table: "ItemCompra",
                column: "idProducto");

            migrationBuilder.CreateIndex(
                name: "IX_ItemVenta_idProducto",
                table: "ItemVenta",
                column: "idProducto");

            migrationBuilder.CreateIndex(
                name: "IX_ItemVenta_idVenta",
                table: "ItemVenta",
                column: "idVenta");

            migrationBuilder.CreateIndex(
                name: "IX_Producto_idCategoria",
                table: "Producto",
                column: "idCategoria");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ItemCompra");

            migrationBuilder.DropTable(
                name: "ItemVenta");

            migrationBuilder.DropTable(
                name: "Compra");

            migrationBuilder.DropTable(
                name: "Producto");

            migrationBuilder.DropTable(
                name: "Venta");

            migrationBuilder.DropTable(
                name: "Proveedor");

            migrationBuilder.DropTable(
                name: "Categoria");
        }
    }
}
