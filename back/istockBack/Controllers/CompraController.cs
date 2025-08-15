using istockBack.DTOs;
using istockBack.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;



public class CompraListaDto
{
    public int IdCompra { get; set; }
    public DateTime Fecha { get; set; }
    public string? Proveedor { get; set; }
    public decimal PrecioTotal { get; set; }
}

namespace istockBack.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class CompraController : ControllerBase
    {
        private readonly IstockDbContext _context;
        public CompraController(IstockDbContext context)
        {
            _context = context;
        }

        // NUEVO: GET: api/compras/paged?page=1&pageSize=10&search=juan
        [HttpGet("paged")]
        public async Task<ActionResult<PagedResult<CompraListaDto>>> GetComprasPaged(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = "")
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0) pageSize = 10;

            var query = _context.Compra
                .AsNoTracking()
                .OrderByDescending(v => v.Fecha)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower();
                query = query.Where(v => v.Proveedor != null && v.Proveedor.ToLower().Contains(s));
            }

            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            var compras = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(v => new CompraListaDto
                {
                    IdCompra = v.IdCompra,
                    Fecha = v.Fecha,
                    Proveedor = v.Proveedor,
                    PrecioTotal = v.PrecioTotal
                })
                .ToListAsync();

            var result = new PagedResult<CompraListaDto>
            {
                Items = compras,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages
            };

            return Ok(result);
        }

        // GET: api/compras
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCompras()
        {
            var compras = await _context.Compra
                .Include(v => v.ItemCompra)
                .ThenInclude(iv => iv.Producto)
                .ToListAsync();

            var resultado = compras.Select(v => new
            {
                v.IdCompra,
                v.Proveedor,
                v.Fecha,
                v.PrecioTotal,
                Productos = v.ItemCompra.Select(iv => new
                {
                    iv.IdProducto,
                    NombreProducto = iv.Producto.Nombre,
                    iv.Cantidad,
                    iv.PrecioUnitario,
                    iv.PrecioTotal
                })
            });

            return Ok(resultado);
        }

        // ✅ GET: api/compras/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetCompraById(int id)
        {
            var compra = await _context.Compra
                .Include(v => v.ItemCompra)
                .ThenInclude(iv => iv.Producto)
                .FirstOrDefaultAsync(v => v.IdCompra == id);

            if (compra == null)
                return NotFound();

            var resultado = new
            {
                compra.IdCompra,
                compra.Proveedor,
                compra.Fecha,
                compra.PrecioTotal,
                Productos = compra.ItemCompra.Select(iv => new
                {
                    iv.IdProducto,
                    NombreProducto = iv.Producto.Nombre,
                    iv.Cantidad,
                    iv.PrecioUnitario,
                    iv.PrecioTotal
                })
            };

            return Ok(resultado);
        }

        [HttpPost]
        public async Task<IActionResult> RegistrarCompra([FromBody] CompraDto compraDto)
        {
            if (compraDto == null || compraDto.Items == null || !compraDto.Items.Any())
                return BadRequest("Datos de compra inválidos.");

            decimal total = 0;

            var nuevaCompra = new Compra
            {
                Proveedor = compraDto.Proveedor,
                Fecha = compraDto.Fecha ?? DateTime.Now,
                ItemCompra = new List<ItemCompra>()
            };

            foreach (var item in compraDto.Items)
            {
                var producto = await _context.Productos.FindAsync(item.IdProducto);
                if (producto == null)
                    return NotFound($"Producto con ID {item.IdProducto} no encontrado.");

                
                // Cálculos
                decimal precioUnitario = producto.PrecioVenta;
                decimal subtotal = precioUnitario * item.Cantidad;

                nuevaCompra.ItemCompra.Add(new ItemCompra
                {
                    IdProducto = item.IdProducto,
                    Cantidad = item.Cantidad,
                    PrecioUnitario = precioUnitario,
                    PrecioTotal = subtotal
                });

                total += subtotal;

            }

            nuevaCompra.PrecioTotal = total;

            _context.Compra.Add(nuevaCompra);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Mensaje = "Compra registrada con éxito.",
                Total = total,
                CompraId = nuevaCompra.IdCompra
            });
        }

        // PUT: api/compras/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarCompra(int id, [FromBody] CompraDto compraDto)
        {
            var ventaExistente = await _context.Compra
                .Include(v => v.ItemCompra)
                .FirstOrDefaultAsync(v => v.IdCompra == id);

            if (ventaExistente == null)
                return NotFound("Compra no encontrada.");

            // Actualizamos solo los campos que pueden modificarse
            ventaExistente.Proveedor = compraDto.Proveedor;
            ventaExistente.Fecha = compraDto.Fecha ?? ventaExistente.Fecha;

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Compra actualizada correctamente." });
        }

        // DELETE: api/compras/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarCompra(int id)
        {
            var compra = await _context.Compra
                .Include(v => v.ItemCompra)
                .FirstOrDefaultAsync(v => v.IdCompra == id);

            if (compra == null)
                return NotFound("Compra no encontrada.");

            
            _context.ItemCompra.RemoveRange(compra.ItemCompra);
            _context.Compra.Remove(compra);

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Compra eliminada correctamente." });
        }
    }
}
