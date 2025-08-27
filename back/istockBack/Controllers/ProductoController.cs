using istockBack.DTOs;
using istockBack.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace istockBack.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly IstockDbContext _context;

        public ProductosController(IstockDbContext context)
        {
            _context = context;
        }

        // GET: api/productos/bycode/{code}
        [HttpGet("bycode/{code}")]
        public async Task<ActionResult<ProductoDto>> GetByCodigoBarra(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
                return BadRequest("Código inválido");

            code = code.Trim();

            var p = await _context.Productos
                .AsNoTracking()
                .Include(x => x.Categoria)
                .FirstOrDefaultAsync(x => x.CodigoBarra == code);

            if (p == null) return NotFound();

            var dto = new ProductoDto
            {
                IdProducto = p.IdProducto,
                Nombre = p.Nombre,
                Descripcion = p.Descripcion,
                PrecioVenta = p.PrecioVenta,
                PrecioCosto = p.PrecioCosto,
                StockActual = p.StockActual,
                StockMinimo = p.StockMinimo,
                IdCategoria = p.IdCategoria,
                CodigoBarra = p.CodigoBarra,
                Categoria = p.Categoria == null ? null : new CategoriaDto
                {
                    IdCategoria = p.Categoria.IdCategoria,
                    Nombre = p.Categoria.Nombre
                }
            };

            return Ok(dto);
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
                    CodigoBarra = p.CodigoBarra,
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
                    CodigoBarra = p.CodigoBarra,
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
        public async Task<ActionResult<ProductoDto>> PostProducto(ProductoDto dto)
        {
            if (dto == null) return BadRequest("Body requerido.");

            var nombre = (dto.Nombre ?? "").Trim();
            if (string.IsNullOrWhiteSpace(nombre))
                return BadRequest("El nombre es obligatorio.");

            // codigoBarra opcional: "" -> null
            var codigoBarra = string.IsNullOrWhiteSpace(dto.CodigoBarra)
                ? null
                : dto.CodigoBarra.Trim();

            // Validar categoría existente
            var categoriaExiste = await _context.Categoria.AnyAsync(c => c.IdCategoria == dto.IdCategoria);
            if (!categoriaExiste)
                return BadRequest("Categoría inexistente.");

            // Si vino código de barras, validar duplicados
            if (codigoBarra != null)
            {
                var duplicado = await _context.Productos.AnyAsync(p => p.CodigoBarra == codigoBarra);
                if (duplicado) return Conflict("Ya existe un producto con ese código de barras.");
            }

            var producto = new Producto
            {
                Nombre = nombre,
                Descripcion = dto.Descripcion?.Trim(),
                PrecioVenta = dto.PrecioVenta,
                PrecioCosto = dto.PrecioCosto,
                StockActual = dto.StockActual,
                StockMinimo = dto.StockMinimo,
                CodigoBarra = codigoBarra,
                IdCategoria = dto.IdCategoria
            };

            _context.Productos.Add(producto);
            await _context.SaveChangesAsync();

            // Armar DTO de respuesta con la categoría
            var categoria = await _context.Categoria
                .Where(c => c.IdCategoria == dto.IdCategoria)
                .Select(c => new CategoriaDto
                {
                    IdCategoria = c.IdCategoria,
                    Nombre = c.Nombre
                })
                .FirstOrDefaultAsync();

            var result = new ProductoDto
            {
                IdProducto = producto.IdProducto,
                Nombre = producto.Nombre,
                Descripcion = producto.Descripcion,
                PrecioVenta = producto.PrecioVenta,
                PrecioCosto = producto.PrecioCosto,
                StockActual = producto.StockActual,
                StockMinimo = producto.StockMinimo,
                CodigoBarra = producto.CodigoBarra,
                IdCategoria = producto.IdCategoria,
                Categoria = categoria ?? new CategoriaDto()
            };

            return CreatedAtAction(nameof(GetProducto), new { id = producto.IdProducto }, result);
        }

        // PUT: api/productos/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProducto(int id, [FromBody] ProductoDto dto)
        {
            if (dto == null) return BadRequest("Body requerido.");

            var producto = await _context.Productos.FirstOrDefaultAsync(p => p.IdProducto == id);
            if (producto == null) return NotFound("Producto no encontrado.");

            var nombre = (dto.Nombre ?? "").Trim();
            if (string.IsNullOrWhiteSpace(nombre))
                return BadRequest("El nombre es obligatorio.");

            // codigoBarra opcional: "" -> null
            var codigoBarra = string.IsNullOrWhiteSpace(dto.CodigoBarra)
                ? null
                : dto.CodigoBarra.Trim();

            // Validar categoría existente
            var categoriaExiste = await _context.Categoria.AnyAsync(c => c.IdCategoria == dto.IdCategoria);
            if (!categoriaExiste)
                return BadRequest("Categoría inexistente.");

            // Si cambió el código y no es null, chequear duplicados
            if (codigoBarra != producto.CodigoBarra && codigoBarra != null)
            {
                var duplicado = await _context.Productos
                    .AnyAsync(p => p.CodigoBarra == codigoBarra && p.IdProducto != id);
                if (duplicado) return Conflict("Ya existe un producto con ese código de barras.");
            }

            // Actualizar campos
            producto.Nombre = nombre;
            producto.Descripcion = dto.Descripcion?.Trim();
            producto.PrecioVenta = dto.PrecioVenta;
            producto.PrecioCosto = dto.PrecioCosto;
            producto.StockActual = dto.StockActual;
            producto.StockMinimo = dto.StockMinimo;
            producto.IdCategoria = dto.IdCategoria;
            producto.CodigoBarra = codigoBarra;

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Producto actualizado correctamente." });
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

        // GET: api/productos/inversion?valorDolar=1234.56
        [HttpGet("inversion")]
        public async Task<IActionResult> GetInversion([FromQuery] decimal? valorDolar)
        {
            var usd = 30 + valorDolar.GetValueOrDefault(1m);
            if (usd <= 0) usd = 1m;

            var productos = await _context.Productos
                .AsNoTracking()
                .Select(p => new
                {
                    p.PrecioCosto,
                    p.StockActual,
                    Categoria = p.Categoria != null ? p.Categoria.Nombre : null
                })
                .ToListAsync();

            decimal totalUSD = 0m;
            decimal totalARS = 0m;

            foreach (var p in productos)
            {
                var nombreCat = (p.Categoria ?? "").Trim().ToLowerInvariant();
                var esAccesorio = nombreCat == "accesorio" || nombreCat == "accesorios";

                // costo unitario en USD/ARS (normalizado por categoría)
                var costoUSD = esAccesorio ? (p.PrecioCosto / usd) : p.PrecioCosto;  // accesorios vienen en ARS → dividir
                var costoARS = esAccesorio ? p.PrecioCosto : (p.PrecioCosto * usd);  // resto vienen en USD → multiplicar

                totalUSD += decimal.Round(costoUSD * p.StockActual, 2);
                totalARS += decimal.Round(costoARS * p.StockActual, 2);
            }

            return Ok(new
            {
                totalCostoUSD = Math.Round(totalUSD, 2),
                totalCostoARS = Math.Round(totalARS, 2),
                valorDolarUsado = usd
            });
        }


    }
}
