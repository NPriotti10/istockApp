using System.ComponentModel.DataAnnotations;

namespace istockBack.Models
{
    public enum TipoGasto
    {
        Pesos = 0,   // se descuenta de ganancias de ACCESORIOS
        Dolares = 1  // se descuenta de ganancias de NO-ACCESORIOS
    }
    public class GastoFijo
    {
        [Key]
        public int Id { get; set; }

        public string Nombre { get; set; } = string.Empty;
        public TipoGasto Tipo { get; set; } // NUEVO

        public decimal Monto { get; set; }
    }
}
