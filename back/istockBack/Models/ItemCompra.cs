using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace istockBack.Models;

public class ItemCompra
{
    public string Nombre { get; set; } = "";
    public string Descripcion { get; set; } = "";
    public decimal PrecioCosto { get; set; }
    public int Cantidad { get; set; }
}


