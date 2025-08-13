namespace istockBack.DTOs
{
    public class VentaDto
    {
        public string? Cliente { get; set; }
        public string? FormaPago { get; set; }
        public DateTime? Fecha { get; set; }
        public decimal ValorDolar { get; set; }
        public string? EquipoPartePago { get; set; }
        public List<ItemVentaDto> Items { get; set; } = new();
    }
}
