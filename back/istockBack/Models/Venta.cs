using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace istockBack.Models;

public class Venta
{
    public int IdVenta { get; set; }

    public string? Cliente { get; set; }

    public DateTime Fecha { get; set; }

    public string? FormaPago { get; set; }

    public decimal PrecioTotal { get; set; }      // antes era solo get
    public decimal GananciaTotal { get; set; }    // antes era solo get
    public decimal ValorDolar { get; set; }   // Valor del dólar en el momento de la venta
    public string? EquipoPartePago { get; set; }  // Equipo entregado como parte de pago (si lo hay)


    public virtual ICollection<ItemVenta> ItemVenta { get; set; } = new List<ItemVenta>();
    public virtual List<ItemVenta> Items { get; set; } = new();

}

