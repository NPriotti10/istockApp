using System;
using System.Collections.Generic;

namespace istockBack.Models;

public partial class Proveedor
{
    public int IdProveedor { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Contacto { get; set; }

    public string? Direccion { get; set; }

    public virtual ICollection<Compra> Compras { get; set; } = new List<Compra>();
}
