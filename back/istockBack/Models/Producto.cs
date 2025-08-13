using System;
using System.Collections.Generic;

namespace istockBack.Models;

public partial class Producto
{
    public int IdProducto { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Descripcion { get; set; }

    public decimal PrecioVenta { get; set; }

    public decimal PrecioCosto { get; set; }

    public int StockActual { get; set; }

    public int StockMinimo { get; set; }

    public int IdCategoria { get; set; }
    public virtual Categoria Categoria { get; set; } = null!;

    public virtual ICollection<ItemVenta> ItemVenta { get; set; } = new List<ItemVenta>();
    public virtual ICollection<ItemCompra> ItemCompra { get; set; } = new List<ItemCompra>();
}
