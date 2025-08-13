using istockBack.Models;

namespace istockBack.DTOs
{
    public class ItemVentaDto
    {
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
        public string? NumeroSerie { get; set; }
    }
}
