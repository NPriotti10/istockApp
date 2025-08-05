using System;
using System.Collections.Generic;

namespace istockBack.Models;

public partial class ItemCompra
{
    public int IdItemCompra { get; set; }

    public int IdCompra { get; set; }

    public int IdProducto { get; set; }

    public int Cantidad { get; set; }

    public decimal PrecioUnitario { get; set; }

    public decimal PrecioTotal { get; set; }

    public virtual Compra IdCompraNavigation { get; set; } = null!;

    public virtual Producto Producto { get; set; } = null!;
}

