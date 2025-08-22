using System.Text.Json;
using istockBack.Models;
using istockBack.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

#region DTOs para Compra (sin relación a Productos)

public class ItemCompraDto
{
    public string Nombre { get; set; } = "";
    public string Descripcion { get; set; } = "";
    public decimal PrecioCosto { get; set; }
    public int Cantidad { get; set; }
}

public class CompraCreateDto
{
    public string? Proveedor { get; set; }
    public DateTime? Fecha { get; set; }
    public List<ItemCompraDto> Items { get; set; } = new();
}

public class CompraDetailDto
{
    public int IdCompra { get; set; }
    public string? Proveedor { get; set; }
    public DateTime Fecha { get; set; }
    public decimal PrecioTotal { get; set; }
    public List<ItemCompraDto> Items { get; set; } = new();
}

public class CompraListaDto
{
    public int IdCompra { get; set; }
    public DateTime Fecha { get; set; }
    public string? Proveedor { get; set; }
    public decimal PrecioTotal { get; set; }
}

#endregion

namespace istockBack.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class CompraController : ControllerBase
    {
        private readonly IstockDbContext _context;
        private static readonly JsonSerializerOptions _json = new()
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = false
        };

        public CompraController(IstockDbContext context)
        {
            _context = context;
        }

        // GET: api/compra/paged?page=1&pageSize=10&search=texto
        [HttpGet("paged")]
        public async Task<ActionResult<PagedResultDto<CompraListaDto>>> GetComprasPaged(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = "")
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;

            var q = _context.Compra.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower();
                q = q.Where(c => c.Proveedor != null && c.Proveedor.ToLower().Contains(s));
            }

            var total = await q.CountAsync();

            var items = await q
                .OrderByDescending(c => c.Fecha)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CompraListaDto
                {
                    IdCompra = c.IdCompra,
                    Fecha = c.Fecha,
                    Proveedor = c.Proveedor,
                    PrecioTotal = c.PrecioTotal
                })
                .ToListAsync();

            return Ok(new PagedResultDto<CompraListaDto>
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize
            });
        }

        // GET: api/compra
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompraDetailDto>>> GetCompras()
        {
            var compras = await _context.Compra
                .AsNoTracking()
                .OrderByDescending(c => c.Fecha)
                .ToListAsync();

            var result = compras.Select(c => new CompraDetailDto
            {
                IdCompra = c.IdCompra,
                Proveedor = c.Proveedor,
                Fecha = c.Fecha,
                PrecioTotal = c.PrecioTotal,
                Items = DeserializeItems(c.ItemsJson).Select(i => new ItemCompraDto
                {
                    Nombre = i.Nombre,
                    Descripcion = i.Descripcion,
                    PrecioCosto = i.PrecioCosto,
                    Cantidad = i.Cantidad
                }).ToList()
            });

            return Ok(result);
        }

        // GET: api/compra/{id}
        [HttpGet("{id:int}")]
        public async Task<ActionResult<CompraDetailDto>> GetCompraById(int id)
        {
            var compra = await _context.Compra.AsNoTracking()
                .FirstOrDefaultAsync(c => c.IdCompra == id);

            if (compra == null) return NotFound();

            var dto = new CompraDetailDto
            {
                IdCompra = compra.IdCompra,
                Proveedor = compra.Proveedor,
                Fecha = compra.Fecha,
                PrecioTotal = compra.PrecioTotal,
                Items = DeserializeItems(compra.ItemsJson).Select(i => new ItemCompraDto
                {
                    Nombre = i.Nombre,
                    Descripcion = i.Descripcion,
                    PrecioCosto = i.PrecioCosto,
                    Cantidad = i.Cantidad
                }).ToList()
            };

            return Ok(dto);
        }

        // POST: api/compra
        [HttpPost]
        public async Task<ActionResult> RegistrarCompra([FromBody] CompraCreateDto dto)
        {
            if (dto == null || dto.Items == null || dto.Items.Count == 0)
                return BadRequest("Debe enviar al menos un ítem.");

            // calcular total y serializar
            var items = dto.Items.Select(i => new ItemCompra
            {
                Nombre = i.Nombre?.Trim() ?? "",
                Descripcion = i.Descripcion?.Trim() ?? "",
                PrecioCosto = i.PrecioCosto,
                Cantidad = i.Cantidad
            }).ToList();

            var total = items.Sum(i => i.PrecioCosto * i.Cantidad);

            var compra = new Compra
            {
                Proveedor = dto.Proveedor,
                Fecha = dto.Fecha ?? DateTime.Now,
                PrecioTotal = total,
                ItemsJson = JsonSerializer.Serialize(items, _json)
            };

            _context.Compra.Add(compra);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCompraById), new { id = compra.IdCompra }, new
            {
                compra.IdCompra,
                compra.Proveedor,
                compra.Fecha,
                compra.PrecioTotal
            });
        }

        // PUT: api/compra/{id}
        [HttpPut("{id:int}")]
        public async Task<ActionResult> ActualizarCompra(int id, [FromBody] CompraCreateDto dto)
        {
            var compra = await _context.Compra.FirstOrDefaultAsync(c => c.IdCompra == id);
            if (compra == null) return NotFound("Compra no encontrada.");

            compra.Proveedor = dto.Proveedor;
            compra.Fecha = dto.Fecha ?? compra.Fecha;

            if (dto.Items != null)
            {
                var items = dto.Items.Select(i => new ItemCompra
                {
                    Nombre = i.Nombre?.Trim() ?? "",
                    Descripcion = i.Descripcion?.Trim() ?? "",
                    PrecioCosto = i.PrecioCosto,
                    Cantidad = i.Cantidad
                }).ToList();

                compra.ItemsJson = JsonSerializer.Serialize(items, _json);
                compra.PrecioTotal = items.Sum(i => i.PrecioCosto * i.Cantidad);
            }

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Compra actualizada correctamente." });
        }

        // DELETE: api/compra/{id}
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> EliminarCompra(int id)
        {
            var compra = await _context.Compra.FirstOrDefaultAsync(c => c.IdCompra == id);
            if (compra == null) return NotFound("Compra no encontrada.");

            _context.Compra.Remove(compra);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Compra eliminada correctamente." });
        }

        #region helpers
        private static List<ItemCompra> DeserializeItems(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return new();
            try
            {
                return JsonSerializer.Deserialize<List<ItemCompra>>(json, _json) ?? new();
            }
            catch
            {
                return new();
            }
        }
        #endregion
    }
}
