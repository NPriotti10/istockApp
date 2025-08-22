using istockBack.DTOs;
using istockBack.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

#region Helpers/DTOs para paginación
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public int TotalItems { get; set; }
}

public class VentaListaDto
{
    public int IdVenta { get; set; }
    public DateTime Fecha { get; set; }
    public string? Cliente { get; set; }
    public decimal PrecioTotal { get; set; }
    public decimal GananciaTotal { get; set; }
    public decimal ValorDolar { get; set; }
    public string? EquipoPartePago { get; set; }
}
#endregion
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class VentasController : ControllerBase
{
    private readonly IstockDbContext _context;

    public VentasController(IstockDbContext context)
    {
        _context = context;
    }

    // NUEVO: GET: api/ventas/paged?page=1&pageSize=10&search=juan
    [HttpGet("paged")]
    public async Task<ActionResult<PagedResult<VentaListaDto>>> GetVentasPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = "")
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0) pageSize = 10;

        var query = _context.Venta
            .AsNoTracking()
            .OrderByDescending(v => v.Fecha)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(v => v.Cliente != null && v.Cliente.ToLower().Contains(s));
        }

        var totalItems = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var ventas = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new VentaListaDto
            {
                IdVenta = v.IdVenta,
                Fecha = v.Fecha,
                Cliente = v.Cliente,
                PrecioTotal = v.PrecioTotal,
                GananciaTotal = v.GananciaTotal,
                ValorDolar = v.ValorDolar,
                EquipoPartePago = v.EquipoPartePago
            })
            .ToListAsync();

        var result = new PagedResult<VentaListaDto>
        {
            Items = ventas,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages
        };

        return Ok(result);
    }

    // GET: api/ventas
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetVentas()
    {
        var ventas = await _context.Venta
            .Include(v => v.ItemVenta)
            .ThenInclude(iv => iv.Producto)
            .ToListAsync();

        var resultado = ventas.Select(v => new
        {
            v.IdVenta,
            v.Cliente,
            v.FormaPago,
            v.Fecha,
            v.PrecioTotal,
            v.GananciaTotal,
            v.EquipoPartePago,
            v.ValorDolar,
            Productos = v.ItemVenta.Select(iv => new
            {
                iv.IdProducto,
                NombreProducto = iv.Producto.Nombre,
                iv.Cantidad,
                iv.NumeroSerie,
                iv.PrecioUnitario,
                iv.PrecioTotal,
                iv.Ganancia
            })
        });

        return Ok(resultado);
    }

    // ✅ GET: api/ventas/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetVentaById(int id)
    {
        var venta = await _context.Venta
            .Include(v => v.ItemVenta)
            .ThenInclude(iv => iv.Producto)
            .FirstOrDefaultAsync(v => v.IdVenta == id);

        if (venta == null)
            return NotFound();

        var resultado = new
        {
            venta.IdVenta,
            venta.Cliente,
            venta.FormaPago,
            venta.Fecha,
            venta.PrecioTotal,
            venta.GananciaTotal,
            venta.EquipoPartePago,
            venta.ValorDolar,
            Productos = venta.ItemVenta.Select(iv => new
            {
                iv.IdProducto,
                NombreProducto = iv.Producto.Nombre,
                iv.Cantidad,
                iv.NumeroSerie,
                iv.PrecioUnitario,
                iv.PrecioTotal,
                iv.Ganancia
            })
        };

        return Ok(resultado);
    }

    // POST: api/ventas
    [HttpPost]
    public async Task<IActionResult> RegistrarVenta([FromBody] VentaDto ventaDto)
    {
        if (ventaDto == null || ventaDto.Items == null || !ventaDto.Items.Any())
            return BadRequest("Datos de venta inválidos.");

        using var tx = await _context.Database.BeginTransactionAsync();

        var valorDolar = ventaDto.ValorDolar > 0 ? ventaDto.ValorDolar : 1m;

        // Batch fetch de productos
        var ids = ventaDto.Items.Select(i => i.IdProducto).ToList();
        var productos = await _context.Productos
            .AsTracking()
            .Include(p => p.Categoria)
            .Where(p => ids.Contains(p.IdProducto))
            .ToDictionaryAsync(p => p.IdProducto);

        decimal total = 0m;
        decimal ganancia = 0m;

        var nuevaVenta = new Venta
        {
            Cliente = ventaDto.Cliente,
            FormaPago = ventaDto.FormaPago,
            Fecha = ventaDto.Fecha ?? DateTime.Now,
            ValorDolar = valorDolar,
            EquipoPartePago = ventaDto.EquipoPartePago ?? "",
            ItemVenta = new List<ItemVenta>()
        };

        foreach (var item in ventaDto.Items)
        {
            if (!productos.TryGetValue(item.IdProducto, out var producto))
                return NotFound($"Producto con ID {item.IdProducto} no encontrado.");

            var cantidad = item.Cantidad > 0 ? item.Cantidad : 1;

            if (producto.StockActual < cantidad)
                return BadRequest(
                    $"Stock insuficiente para '{producto.Nombre}'. Disponible: {producto.StockActual}, requerido: {cantidad}");

            var nombreCat = (producto.Categoria?.Nombre ?? "").Trim().ToLowerInvariant();
            var esAccesorio = nombreCat == "accesorios" || nombreCat == "accesorio";

            // Si es Accesorio, los precios vienen en ARS → pasar a USD
            var precioVenta = producto.PrecioVenta; // asumo no nulos; si pueden ser nulos: ?? 0m
            var precioCosto = producto.PrecioCosto;

            var precioUnitarioUSD = esAccesorio
                ? decimal.Round(precioVenta / valorDolar, 2)
                : decimal.Round(precioVenta, 2);

            var costoUSD = esAccesorio
                ? decimal.Round(precioCosto / valorDolar, 2)
                : decimal.Round(precioCosto, 2);

            var subtotalUSD = decimal.Round(precioUnitarioUSD * cantidad, 2);
            var gananciaItemUSD = decimal.Round((precioUnitarioUSD - costoUSD) * cantidad, 2);

            nuevaVenta.ItemVenta.Add(new ItemVenta
            {
                IdProducto = producto.IdProducto,
                Cantidad = cantidad,
                NumeroSerie = item.NumeroSerie,
                PrecioUnitario = precioUnitarioUSD,
                PrecioTotal = subtotalUSD,
                Ganancia = gananciaItemUSD
            });

            total += subtotalUSD;
            ganancia += gananciaItemUSD;

            // Descontar stock
            producto.StockActual -= cantidad;
        }

        nuevaVenta.PrecioTotal = decimal.Round(total, 2);
        nuevaVenta.GananciaTotal = decimal.Round(ganancia, 2);

        _context.Venta.Add(nuevaVenta);
        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new
        {
            Mensaje = "Venta registrada con éxito.",
            Total = nuevaVenta.PrecioTotal,
            Ganancia = nuevaVenta.GananciaTotal,
            VentaId = nuevaVenta.IdVenta
        });
    }


    // PUT: api/ventas/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarVenta(int id, [FromBody] VentaDto ventaDto)
    {
        var ventaExistente = await _context.Venta
            .Include(v => v.ItemVenta)
            .FirstOrDefaultAsync(v => v.IdVenta == id);

        if (ventaExistente == null)
            return NotFound("Venta no encontrada.");

        // Actualizamos solo los campos que pueden modificarse
        ventaExistente.Cliente = ventaDto.Cliente;
        ventaExistente.FormaPago = ventaDto.FormaPago;
        ventaExistente.EquipoPartePago = ventaDto.EquipoPartePago;
        ventaExistente.Fecha = ventaDto.Fecha ?? ventaExistente.Fecha;

        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Venta actualizada correctamente." });
    }

    // DELETE: api/ventas/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarVenta(int id)
    {
        var venta = await _context.Venta
            .Include(v => v.ItemVenta)
            .FirstOrDefaultAsync(v => v.IdVenta == id);

        if (venta == null)
            return NotFound("Venta no encontrada.");

        // Devolver el stock de los productos antes de eliminar
        foreach (var item in venta.ItemVenta)
        {
            var producto = await _context.Productos.FindAsync(item.IdProducto);
            if (producto != null)
            {
                producto.StockActual += item.Cantidad;
            }
        }

        _context.ItemVenta.RemoveRange(venta.ItemVenta);
        _context.Venta.Remove(venta);

        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Venta eliminada correctamente." });
    }

    [HttpGet("estadisticas")]
    public async Task<IActionResult> ObtenerEstadisticas()
    {
        var hoy = DateTime.Today;
        var inicioSemana = hoy.AddDays(-(int)hoy.DayOfWeek + 1); // lunes
        var inicioMes = new DateTime(hoy.Year, hoy.Month, 1);

        var ventas = await _context.Venta.ToListAsync();

        var ventasSemanales = ventas.Where(v => v.Fecha >= inicioSemana).ToList();
        var ventasMensuales = ventas.Where(v => v.Fecha >= inicioMes).ToList();

        var totalGastosFijos = await _context.GastoFijo.SumAsync(g => g.Monto);

        // Ganancias semanales
        var gananciaSemanalUSD = ventasSemanales.Sum(v => v.GananciaTotal);
        var gananciaSemanalARS = ventasSemanales.Sum(v => v.GananciaTotal * v.ValorDolar);

        // Ganancias mensuales
        var gananciaMensualUSD = ventasMensuales.Sum(v => v.GananciaTotal);
        var gananciaMensualARS = ventasMensuales.Sum(v => v.GananciaTotal * v.ValorDolar);

        // Descontar gastos fijos (en USD)
        var gananciaMensualUSDNeta = gananciaMensualUSD - totalGastosFijos;

        return Ok(new
        {
            ventasSemanales,
            ventasMensuales,
            gananciaSemanalARS = Math.Round(gananciaSemanalARS, 2),
            gananciaSemanalUSD = Math.Round(gananciaSemanalUSD, 2),
            gananciaMensualARS = Math.Round(gananciaMensualARS, 2),
            gananciaMensualUSD = Math.Round(gananciaMensualUSD, 2),
            gananciaMensualUSDNeta = Math.Round(gananciaMensualUSDNeta),
            totalGastosFijos = Math.Round(totalGastosFijos, 2)
        });
    }

    [HttpGet("bajostock")]
    public async Task<IActionResult> GetProductosBajoStock()
    {
        var productos = await _context.Productos
            .Where(p => p.StockActual <= p.StockMinimo)
            .ToListAsync();

        return Ok(productos); // 👈 esto devuelve una lista (array)
    }
}