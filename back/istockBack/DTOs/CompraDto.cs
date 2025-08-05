namespace istockBack.DTOs
{
    public class CompraDto
    {
        public int IdProveedor { get; set; }
        public DateTime Fecha { get; set; } = DateTime.Now;
        public List<ItemCompraDto> Items { get; set; } = new();
    }
}
