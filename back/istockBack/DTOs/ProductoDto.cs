namespace istockBack.DTOs
{
    public class ProductoDto
    {
        public int IdProducto { get; set; }
        public string Nombre { get; set; } = null!;
        public string? Descripcion { get; set; }
        public decimal PrecioVenta { get; set; }
        public decimal PrecioCosto { get; set; }
        public int StockActual { get; set; }
        public int StockMinimo { get; set; }
        public int IdCategoria { get; set; }
        public CategoriaDto? Categoria { get; set; } = null!;

        public string? CodigoBarra { get; set; }
    }
}
