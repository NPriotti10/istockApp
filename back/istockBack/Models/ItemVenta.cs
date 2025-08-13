using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace istockBack.Models;

public class ItemVenta
{
    public int IdItemVenta { get; set; }

    public int IdVenta { get; set; }

    public int IdProducto { get; set; }

    public int Cantidad { get; set; }
    public string? NumeroSerie { get; set; }

    public decimal PrecioUnitario { get; set; }

    public virtual Venta Venta { get; set; } = null!;

    public virtual Producto Producto { get; set; } = null!;

    public decimal PrecioTotal { get; set; }  // antes era solo get
    public decimal Ganancia { get; set; }     // antes era solo get


}


