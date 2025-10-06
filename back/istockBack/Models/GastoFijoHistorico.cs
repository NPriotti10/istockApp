using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace istockBack.Models
{
    public class GastoFijoHistorico
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string Nombre { get; set; } = "";

        [Required]
        public decimal Monto { get; set; }

        [Required]
        public TipoGasto Tipo { get; set; }

        [Required]
        public int Mes { get; set; }

        [Required]
        public int Año { get; set; }
    }
}
