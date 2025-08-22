namespace istockBack.Models
{
    public class ItemCompraDto
    {
        public string Nombre { get; set; } = "";
        public string? Descripcion { get; set; }
        public decimal PrecioCosto { get; set; }
        public int Cantidad { get; set; }
    }
}