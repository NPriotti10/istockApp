namespace istockBack.DTOs
{
    public class ItemCompraDto
    {
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }      // precioCosto nuevo
        public decimal PrecioVentaNuevo { get; set; }    // nuevo precio de venta
        public decimal PrecioTotal => Cantidad * PrecioUnitario;
        public decimal Ganancia => PrecioVentaNuevo - PrecioUnitario;
    }
}
