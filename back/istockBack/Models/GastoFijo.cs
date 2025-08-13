using System.ComponentModel.DataAnnotations;

namespace istockBack.Models
{
    public class GastoFijo
    {
        [Key]
        public int Id { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public decimal Monto { get; set; }
    }
}
