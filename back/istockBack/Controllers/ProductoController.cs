using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using istockBack.Models;
using istockBack.DTOs;

namespace istockBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly IstockDbContext _context;

        public ProductosController(IstockDbContext context)
        {
            _context = context;
        }

        // GET: api/productos
        [HttpGet]
        public async Task<ActionResult<PagedResultDto<ProductoDto>>> GetProductos(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] int? categoriaId = null)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;

            var query = _context.Productos
                .AsNoTracking()
                .Include(p => p.Categoria)
                .AsQueryable();

            // Filtros
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim();
                query = query.Where(p =>
                    p.Nombre.Contains(search));
            }

            if (categoriaId.HasValue)
            {
                query = query.Where(p => p.IdCategoria == categoriaId.Value);
            }

            // Total antes de paginar
            var total = await query.CountAsync();

            // Página
            var items = await query
                .OrderBy(p => p.Nombre)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new ProductoDto
                {
                    IdProducto = p.IdProducto,
                    Nombre = p.Nombre,
                    Descripcion = p.Descripcion,
                    PrecioVenta = p.PrecioVenta,
                    PrecioCosto = p.PrecioCosto,
                    StockActual = p.StockActual,
                    StockMinimo = p.StockMinimo,
                    IdCategoria = p.IdCategoria,
                    Categoria = new CategoriaDto
                    {
                        IdCategoria = p.Categoria.IdCategoria,
                        Nombre = p.Categoria.Nombre
                    }
                })
                .ToListAsync();

            return Ok(new PagedResultDto<ProductoDto>
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize
            });
        }

        // GET: api/productos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductoDto>> GetProducto(int id)
        {
            var producto = await _context.Productos
                .Include(p => p.Categoria)
                .Where(p => p.IdProducto == id)
                .Select(p => new ProductoDto
                {
                    IdProducto = p.IdProducto,
                    Nombre = p.Nombre,
                    Descripcion = p.Descripcion,
                    PrecioVenta = p.PrecioVenta,
                    PrecioCosto = p.PrecioCosto,
                    StockActual = p.StockActual,
                    StockMinimo = p.StockMinimo,
                    IdCategoria = p.IdCategoria,
                    Categoria = new CategoriaDto
                    {
                        IdCategoria = p.Categoria.IdCategoria,
                        Nombre = p.Categoria.Nombre
                    }
                })
                .FirstOrDefaultAsync();

            if (producto == null)
                return NotFound();

            return producto;
        }

        // POST: api/productos
        [HttpPost]
        public async Task<ActionResult<ProductoDto>> PostProducto(ProductoDto productoDto)
        {
            var producto = new Producto
            {
                Nombre = productoDto.Nombre,
                Descripcion = productoDto.Descripcion,
                PrecioVenta = productoDto.PrecioVenta,
                PrecioCosto = productoDto.PrecioCosto,
                StockActual = productoDto.StockActual,
                StockMinimo = productoDto.StockMinimo,
                IdCategoria = productoDto.IdCategoria
            };

            _context.Productos.Add(producto);
            await _context.SaveChangesAsync();

            productoDto.IdProducto = producto.IdProducto;

            var categoria = await _context.Categoria
                .Where(c => c.IdCategoria == productoDto.IdCategoria)
                .Select(c => new CategoriaDto
                {
                    IdCategoria = c.IdCategoria,
                    Nombre = c.Nombre
                })
                .FirstOrDefaultAsync();

            productoDto.Categoria = categoria ?? new CategoriaDto();

            return CreatedAtAction(nameof(GetProducto), new { id = producto.IdProducto }, productoDto);
        }

        // PUT: api/productos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProducto(int id, ProductoDto productoDto)
        {
            if (id != productoDto.IdProducto)
                return BadRequest();

            var producto = await _context.Productos.FindAsync(id);
            if (producto == null)
                return NotFound();

            producto.Nombre = productoDto.Nombre;
            producto.Descripcion = productoDto.Descripcion;
            producto.PrecioVenta = productoDto.PrecioVenta;
            producto.PrecioCosto = productoDto.PrecioCosto;
            producto.StockActual = productoDto.StockActual;
            producto.StockMinimo = productoDto.StockMinimo;
            producto.IdCategoria = productoDto.IdCategoria;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/productos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProducto(int id)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null)
                return NotFound();

            _context.Productos.Remove(producto);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
