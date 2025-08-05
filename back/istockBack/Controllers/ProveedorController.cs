using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using istockBack.Models;
using istockBack.DTOs;

namespace istockBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProveedoresController : ControllerBase
    {
        private readonly IstockDbContext _context;

        public ProveedoresController(IstockDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProveedorDto>>> GetProveedores()
        {
            return await _context.Proveedor
                .Select(p => new ProveedorDto
                {
                    IdProveedor = p.IdProveedor,
                    Nombre = p.Nombre,
                    Contacto = p.Contacto,
                    Direccion = p.Direccion
                })
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProveedorDto>> GetProveedor(int id)
        {
            var proveedor = await _context.Proveedor
                .Where(p => p.IdProveedor == id)
                .Select(p => new ProveedorDto
                {
                    IdProveedor = p.IdProveedor,
                    Nombre = p.Nombre,
                    Contacto = p.Contacto,
                    Direccion = p.Direccion
                })
                .FirstOrDefaultAsync();

            if (proveedor == null)
                return NotFound();

            return proveedor;
        }

        [HttpPost]
        public async Task<ActionResult<ProveedorDto>> PostProveedor(ProveedorDto proveedorDto)
        {
            var proveedor = new Proveedor
            {
                Nombre = proveedorDto.Nombre,
                Contacto = proveedorDto.Contacto,
                Direccion = proveedorDto.Direccion
            };

            _context.Proveedor.Add(proveedor);
            await _context.SaveChangesAsync();

            proveedorDto.IdProveedor = proveedor.IdProveedor;
            return CreatedAtAction(nameof(GetProveedor), new { id = proveedor.IdProveedor }, proveedorDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutProveedor(int id, ProveedorDto proveedorDto)
        {
            if (id != proveedorDto.IdProveedor)
                return BadRequest();

            var proveedor = await _context.Proveedor.FindAsync(id);
            if (proveedor == null)
                return NotFound();

            proveedor.Nombre = proveedorDto.Nombre;
            proveedor.Contacto = proveedorDto.Contacto;
            proveedor.Direccion = proveedorDto.Direccion;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProveedor(int id)
        {
            var proveedor = await _context.Proveedor.FindAsync(id);
            if (proveedor == null)
                return NotFound();

            _context.Proveedor.Remove(proveedor);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
