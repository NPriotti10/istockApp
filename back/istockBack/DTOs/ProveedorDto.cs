namespace istockBack.DTOs
{
    public class ProveedorDto
    {
        public int IdProveedor { get; set; }
        public string Nombre { get; set; } = null!;
        public string? Contacto { get; set; }
        public string? Direccion { get; set; }
    }
}
