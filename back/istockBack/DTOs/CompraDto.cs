using istockBack.Models;

namespace istockBack.DTOs
{
    public class CompraDto
    {
        public int? IdCompra { get; set; }
        public DateTime? Fecha { get; set; }
        public string? Proveedor { get; set; }
        public decimal? PrecioTotal { get; set; }   // lo calcula el back, pero lo dejamos por compatibilidad
        public List<ItemCompraDto> Items { get; set; } = new();
    }
}