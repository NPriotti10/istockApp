namespace istockBack.DTOs
{
    public class CompraDto
    {
        public string? Proveedor { get; set; }
        public DateTime? Fecha { get; set; }
        public List<ItemCompraDto> Items { get; set; } = new();
    }
}
