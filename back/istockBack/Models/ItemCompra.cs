using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace istockBack.Models;

public class ItemCompra
{
    public int IdItemCompra { get; set; }

    public int IdCompra { get; set; }

    public int IdProducto { get; set; }

    public int Cantidad { get; set; }

    public decimal PrecioUnitario { get; set; }

    public virtual Compra Compra { get; set; } = null!;

    public virtual Producto Producto { get; set; } = null!;

    public decimal PrecioTotal { get; set; } 


}


