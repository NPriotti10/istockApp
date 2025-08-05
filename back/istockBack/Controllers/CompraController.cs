using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using istockBack.Models;
using istockBack.DTOs;

namespace istockBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompraController : ControllerBase
    {
        private readonly IstockDbContext _context;

        public CompraController(IstockDbContext context)
        {
            _context = context;
        }

        // POST: api/compras
        [HttpPost]
        public async Task<IActionResult> PostCompra(CompraDto compraDto)
        {
            var compra = new Compra
            {
                IdProveedor = compraDto.IdProveedor,
                Fecha = compraDto.Fecha
            };

            _context.Compra.Add(compra);
            await _context.SaveChangesAsync();

            foreach (var item in compraDto.Items)
            {
                var producto = await _context.Productos.FindAsync(item.IdProducto);
                if (producto == null)
                    return NotFound($"Producto ID {item.IdProducto} no encontrado.");

                producto.StockActual += item.Cantidad;
                producto.PrecioCosto = item.PrecioUnitario;
                producto.PrecioVenta = item.PrecioVentaNuevo;

                var itemCompra = new ItemCompra
                {
                    IdCompra = compra.IdCompra,
                    IdProducto = item.IdProducto,
                    Cantidad = item.Cantidad,
                    PrecioUnitario = item.PrecioUnitario,
                    PrecioTotal = item.Cantidad * item.PrecioUnitario
                };

                _context.ItemCompra.Add(itemCompra);
            }

            await _context.SaveChangesAsync();

            return Ok(new { compra.IdCompra, compra.Fecha, compra.IdProveedor });
        }

        // GET: api/compras
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompraDto>>> GetCompras()
        {
            var compras = await _context.Compra
                .Include(c => c.ItemCompra)
                .ThenInclude(ic => ic.Producto)
                .Select(c => new CompraDto
                {
                    IdProveedor = c.IdProveedor,
                    Fecha = c.Fecha,
                    Items = c.ItemCompra.Select(ic => new ItemCompraDto
                    {
                        IdProducto = ic.IdProducto,
                        Cantidad = ic.Cantidad,
                        PrecioUnitario = ic.PrecioUnitario,
                        PrecioVentaNuevo = ic.Producto.PrecioVenta
                    }).ToList()
                }).ToListAsync();

            return compras;
        }

        // GET: api/compras/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<CompraDto>> GetCompra(int id)
        {
            var compra = await _context.Compra
                .Include(c => c.ItemCompra)
                .ThenInclude(ic => ic.Producto)
                .Where(c => c.IdCompra == id)
                .Select(c => new CompraDto
                {
                    IdProveedor = c.IdProveedor,
                    Fecha = c.Fecha,
                    Items = c.ItemCompra.Select(ic => new ItemCompraDto
                    {
                        IdProducto = ic.IdProducto,
                        Cantidad = ic.Cantidad,
                        PrecioUnitario = ic.PrecioUnitario,
                        PrecioVentaNuevo = ic.Producto.PrecioVenta
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (compra == null)
                return NotFound();

            return compra;
        }

        // PUT: api/compras/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCompra(int id, CompraDto compraDto)
        {
            var compra = await _context.Compra.FindAsync(id);
            if (compra == null)
                return NotFound();

            compra.IdProveedor = compraDto.IdProveedor;
            compra.Fecha = compraDto.Fecha;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/compras/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompra(int id)
        {
            var compra = await _context.Compra
                .Include(c => c.ItemCompra)
                .FirstOrDefaultAsync(c => c.IdCompra == id);

            if (compra == null)
                return NotFound();

            // Revertir stock de productos si querés:
            foreach (var item in compra.ItemCompra)
            {
                var producto = await _context.Productos.FindAsync(item.IdProducto);
                if (producto != null)
                {
                    producto.StockActual -= item.Cantidad;
                }
            }

            _context.ItemCompra.RemoveRange(compra.ItemCompra);
            _context.Compra.Remove(compra);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
