using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace istockBack.Models
{
    public class Compra
    {
        public int IdCompra { get; set; }
        public DateTime Fecha { get; set; } = DateTime.UtcNow;
        public string? Proveedor { get; set; }

        // Total de la compra (se recalcula desde los items)
        public decimal PrecioTotal { get; set; }

        // ❗ Se guarda en DB como NVARCHAR(MAX)
        public string ItemsJson { get; set; } = "[]";

        // ✔ Propiedad de conveniencia NO mapeada, para trabajar tipado en C#
        [NotMapped]
        public List<ItemCompra> Items { get; set; } = new();
        
    }
}
