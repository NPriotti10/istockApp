using System;

namespace istockBack.Models
{
    public class ItemVenta
    {
        public int IdItemVenta { get; set; }

        public int IdVenta { get; set; }

        // Hacemos opcional el vínculo al producto para poder borrarlo luego del inventario
        public int? IdProducto { get; set; }

        public int Cantidad { get; set; }
        public string? NumeroSerie { get; set; }

        // Montos en USD (ya convertidos si es Accesorio)
        public decimal PrecioUnitario { get; set; }  // USD
        public decimal CostoUnitario { get; set; }  // USD (snapshot del costo)
        public decimal PrecioTotal { get; set; }  // USD
        public decimal Ganancia { get; set; }  // USD

        // SNAPSHOTS del producto al momento de la venta
        public string? NombreProducto { get; set; }
        public string? CodigoBarra { get; set; }
        public string? CategoriaNombre { get; set; }

        // Navs
        public virtual Venta Venta { get; set; } = null!;

        // OJO: ahora es opcional porque IdProducto es nullable
        public virtual Producto? Producto { get; set; }
    }
}
