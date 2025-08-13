using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace istockBack.Models;

public class Compra
{
    public int IdCompra { get; set; }

    public string? Proveedor { get; set; }

    public DateTime Fecha { get; set; }

    public decimal PrecioTotal { get; set; }  
    public virtual ICollection<ItemCompra> ItemCompra { get; set; } = new List<ItemCompra>();
    public virtual List<ItemCompra> Items { get; set; } = new();

}

