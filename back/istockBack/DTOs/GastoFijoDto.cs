using istockBack.Models;

namespace istockBack.Dtos
{
    public class GastoFijoDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public TipoGasto Tipo { get; set; }
        public decimal Monto { get; set; }
    }
}
