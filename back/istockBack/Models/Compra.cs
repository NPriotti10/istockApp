using System;
using System.Collections.Generic;

namespace istockBack.Models;

public partial class Compra
{
    public int IdCompra { get; set; }

    public int IdProveedor { get; set; }

    public decimal PrecioCosto { get; set; }

    public DateTime Fecha { get; set; }

    public virtual Proveedor IdProveedorNavigation { get; set; } = null!;

    public virtual ICollection<ItemCompra> ItemCompra { get; set; } = new List<ItemCompra>();
}
