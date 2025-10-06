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

    // ====== Zona horaria/UTC helpers ======
    private static readonly string[] BsAsTzIds = new[]
    {
        "America/Argentina/Buenos_Aires",   // Linux
        "Argentina Standard Time"           // Windows
    };

    private static TimeZoneInfo GetBsAsTz()
    {
        foreach (var id in BsAsTzIds)
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch { /* sigue intentando */ }
        }
        return TimeZoneInfo.Local;
    }

    private static DateTime ToUtc(DateTime? incoming)
    {
        if (incoming is null) return DateTime.UtcNow;
        var dt = incoming.Value;
        if (dt.Kind == DateTimeKind.Unspecified)
            return DateTime.SpecifyKind(dt, DateTimeKind.Local).ToUniversalTime();
        return dt.ToUniversalTime();
    }

    private static DateTime LocalToUtc(DateTime local, TimeZoneInfo tz) =>
        TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(local, DateTimeKind.Unspecified), tz);

    // GET: api/ventas/paged?page=1&pageSize=10&search=juan
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

    // GET: api/ventas (completo, ordenado desc)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetVentas()
    {
        var ventas = await _context.Venta
            .AsNoTracking()
            .Include(v => v.ItemVenta)
                .ThenInclude(iv => iv.Producto)
                    .ThenInclude(p => p!.Categoria)
            .OrderByDescending(v => v.Fecha)
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
                NombreProducto = !string.IsNullOrWhiteSpace(iv.NombreProducto)
                                    ? iv.NombreProducto
                                    : (iv.Producto?.Nombre ?? "(producto eliminado)"),
                CategoriaNombre = !string.IsNullOrWhiteSpace(iv.CategoriaNombre)
                                    ? iv.CategoriaNombre
                                    : (iv.Producto?.Categoria?.Nombre ?? null),
                iv.Cantidad,
                iv.NumeroSerie,
                iv.PrecioUnitario,
                iv.PrecioTotal,
                iv.Ganancia
            })
        });

        return Ok(resultado);
    }

    // GET: api/ventas/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetVentaById(int id)
    {
        var venta = await _context.Venta
            .AsNoTracking()
            .Include(v => v.ItemVenta)
                .ThenInclude(iv => iv.Producto)
                    .ThenInclude(p => p!.Categoria)
            .FirstOrDefaultAsync(v => v.IdVenta == id);

        if (venta == null) return NotFound();

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
                NombreProducto = !string.IsNullOrWhiteSpace(iv.NombreProducto)
                                    ? iv.NombreProducto
                                    : (iv.Producto?.Nombre ?? "(producto eliminado)"),
                CategoriaNombre = !string.IsNullOrWhiteSpace(iv.CategoriaNombre)
                                    ? iv.CategoriaNombre
                                    : (iv.Producto?.Categoria?.Nombre ?? null),
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
        if (ventaDto == null || ventaDto.Items == null || ventaDto.Items.Count == 0)
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

        var usadosAEliminar = new List<int>();

        var nuevaVenta = new Venta
        {
            Cliente = ventaDto.Cliente,
            FormaPago = ventaDto.FormaPago,
            Fecha = ToUtc(ventaDto.Fecha), // ✅ UTC
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
                return BadRequest($"Stock insuficiente para '{producto.Nombre}'. Disponible: {producto.StockActual}, requerido: {cantidad}");

            var nombreCat = (producto.Categoria?.Nombre ?? "").Trim().ToLowerInvariant();
            var esAccesorio = nombreCat == "accesorios" || nombreCat == "accesorio";
            var esUsado = nombreCat == "usado" || nombreCat == "usados";

            var precioVenta = producto.PrecioVenta;
            var precioCosto = producto.PrecioCosto;

            // Accesorios se guardan en USD (precio/valorDolar), resto en USD "tal cual"
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
                NumeroSerie = string.IsNullOrWhiteSpace(item.NumeroSerie) ? null : item.NumeroSerie,

                PrecioUnitario = precioUnitarioUSD,
                CostoUnitario = costoUSD,
                PrecioTotal = subtotalUSD,
                Ganancia = gananciaItemUSD,

                // SNAPSHOTS
                NombreProducto = producto.Nombre,
                CodigoBarra = producto.CodigoBarra,
                CategoriaNombre = producto.Categoria?.Nombre
            });

            total += subtotalUSD;
            ganancia += gananciaItemUSD;

            // Descontar stock
            producto.StockActual -= cantidad;

            // Usados: si quedó sin stock, marcar para eliminar
            if (esUsado && producto.StockActual <= 0)
                usadosAEliminar.Add(producto.IdProducto);
        }

        nuevaVenta.PrecioTotal = decimal.Round(total, 2);
        nuevaVenta.GananciaTotal = decimal.Round(ganancia, 2);

        _context.Venta.Add(nuevaVenta);
        await _context.SaveChangesAsync();

        // Usados: eliminar del inventario (si falla FK, se ignora y queda en 0)
        if (usadosAEliminar.Count > 0)
        {
            var aBorrar = await _context.Productos
                .Where(p => usadosAEliminar.Contains(p.IdProducto))
                .ToListAsync();
            try
            {
                _context.Productos.RemoveRange(aBorrar);
                await _context.SaveChangesAsync();
            }
            catch { /* dejar stock 0 */ }
        }

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
    public async Task<IActionResult> ActualizarVenta(int id, [FromBody] VentaDto dto)
    {
        if (dto is null) return BadRequest("Body inválido.");

        using var tx = await _context.Database.BeginTransactionAsync();

        var venta = await _context.Venta
            .Include(v => v.ItemVenta)
            .FirstOrDefaultAsync(v => v.IdVenta == id);

        if (venta == null)
            return NotFound("Venta no encontrada.");

        // restaurar stock
        foreach (var old in venta.ItemVenta)
        {
            var prodRestore = await _context.Productos.FindAsync(old.IdProducto);
            if (prodRestore != null) prodRestore.StockActual += old.Cantidad;
        }

        _context.ItemVenta.RemoveRange(venta.ItemVenta);
        await _context.SaveChangesAsync();

        var valorDolar = dto.ValorDolar > 0 ? dto.ValorDolar : venta.ValorDolar > 0 ? venta.ValorDolar : 1m;
        venta.Cliente = dto.Cliente;
        venta.FormaPago = dto.FormaPago;
        venta.EquipoPartePago = dto.EquipoPartePago;
        venta.ValorDolar = valorDolar;
        venta.Fecha = ToUtc(dto.Fecha ?? venta.Fecha); // ✅ UTC

        decimal total = 0m, ganancia = 0m;
        venta.ItemVenta = new List<ItemVenta>();
        var usadosAEliminar = new List<int>();

        if (dto.Items != null && dto.Items.Count != 0)
        {
            var ids = dto.Items.Select(i => i.IdProducto).ToList();
            var productos = await _context.Productos
                .AsTracking()
                .Include(p => p.Categoria)
                .Where(p => ids.Contains(p.IdProducto))
                .ToDictionaryAsync(p => p.IdProducto);

            foreach (var it in dto.Items)
            {
                if (!productos.TryGetValue(it.IdProducto, out var prod))
                    return BadRequest($"Producto {it.IdProducto} inexistente.");

                var cantidad = it.Cantidad > 0 ? it.Cantidad : 1;

                if (prod.StockActual < cantidad)
                    return BadRequest($"Stock insuficiente para {prod.Nombre}. Disponible: {prod.StockActual}");

                // Descontar stock
                prod.StockActual -= cantidad;

                var nombreCat = (prod.Categoria?.Nombre ?? "").Trim().ToLowerInvariant();
                var esAcc = nombreCat == "accesorios" || nombreCat == "accesorio";
                var esUsado = nombreCat == "usado" || nombreCat == "usados";

                var precioUnit = esAcc
                    ? decimal.Round(prod.PrecioVenta / valorDolar, 2)
                    : decimal.Round(prod.PrecioVenta, 2);

                var costoUSD = esAcc
                    ? decimal.Round(prod.PrecioCosto / valorDolar, 2)
                    : decimal.Round(prod.PrecioCosto, 2);

                var subtotal = decimal.Round(precioUnit * cantidad, 2);
                var utilidad = decimal.Round((precioUnit - costoUSD) * cantidad, 2);

                venta.ItemVenta.Add(new ItemVenta
                {
                    IdProducto = prod.IdProducto,
                    Cantidad = cantidad,
                    NumeroSerie = string.IsNullOrWhiteSpace(it.NumeroSerie) ? null : it.NumeroSerie,
                    PrecioUnitario = precioUnit,
                    CostoUnitario = costoUSD,
                    PrecioTotal = subtotal,
                    Ganancia = utilidad,

                    // SNAPSHOTS
                    NombreProducto = prod.Nombre,
                    CodigoBarra = prod.CodigoBarra,
                    CategoriaNombre = prod.Categoria?.Nombre
                });

                total += subtotal;
                ganancia += utilidad;

                if (esUsado && prod.StockActual <= 0)
                    usadosAEliminar.Add(prod.IdProducto);
            }
        }

        venta.PrecioTotal = decimal.Round(total, 2);
        venta.GananciaTotal = decimal.Round(ganancia, 2);

        await _context.SaveChangesAsync();

        if (usadosAEliminar.Count > 0)
        {
            var aBorrar = await _context.Productos
                .Where(p => usadosAEliminar.Contains(p.IdProducto))
                .ToListAsync();

            try
            {
                _context.Productos.RemoveRange(aBorrar);
                await _context.SaveChangesAsync();
            }
            catch { /* dejar en stock 0 si hay FK */ }
        }

        await tx.CommitAsync();

        return Ok(new { mensaje = "Venta actualizada correctamente.", total = venta.PrecioTotal, ganancia = venta.GananciaTotal });
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



    // GET: api/ventas/estadisticas
    [HttpGet("estadisticas")]
    public async Task<IActionResult> ObtenerEstadisticas([FromQuery] int? year, [FromQuery] int? month)
    {
        var tz = GetBsAsTz();

        // === Mes objetivo (si no viene por query, usa el actual) ===
        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        int y = year ?? nowLocal.Year;
        int m = month ?? nowLocal.Month;

        var inicioMesLocal = new DateTime(y, m, 1, 0, 0, 0, DateTimeKind.Unspecified);
        var finMesLocal = inicioMesLocal.AddMonths(1).AddTicks(-1);

        var inicioSemanaLocal = nowLocal.Date.AddDays(-(((int)nowLocal.DayOfWeek + 6) % 7));
        var inicioSemanaUtc = LocalToUtc(inicioSemanaLocal, tz);
        var inicioMesUtc = LocalToUtc(inicioMesLocal, tz);
        var finMesUtc = LocalToUtc(finMesLocal, tz);

        // Ventas del MES seleccionado
        var ventasMes = await _context.Venta
            .AsNoTracking()
            .Where(v => v.Fecha >= inicioMesUtc && v.Fecha <= finMesUtc)
            .Include(v => v.ItemVenta)
                .ThenInclude(iv => iv.Producto)
                    .ThenInclude(p => p!.Categoria)
            .ToListAsync();

        // === Helpers ===
        bool EsAccesorioLocal(ItemVenta iv)
        {
            var nombre = (iv.CategoriaNombre ?? iv.Producto?.Categoria?.Nombre ?? "")
                .Trim().ToLowerInvariant()
                .Replace("á", "a").Replace("é", "e").Replace("í", "i").Replace("ó", "o").Replace("ú", "u");
            return nombre.Contains("accesor");
        }

        decimal SumarBrutoUSDExclAcc(IEnumerable<Venta> vv) =>
            vv.Sum(v => (v.ItemVenta ?? Enumerable.Empty<ItemVenta>())
                .Where(iv => !EsAccesorioLocal(iv))
                .Sum(iv => iv.PrecioTotal));

        decimal SumarBrutoARSExclAcc(IEnumerable<Venta> vv) =>
            vv.Sum(v => (v.ItemVenta ?? Enumerable.Empty<ItemVenta>())
                .Where(iv => !EsAccesorioLocal(iv))
                .Sum(iv => iv.PrecioTotal * v.ValorDolar));

        decimal SumarBrutoAccesoriosARS(IEnumerable<Venta> vv) =>
            vv.Sum(v => (v.ItemVenta ?? Enumerable.Empty<ItemVenta>())
                .Where(iv => EsAccesorioLocal(iv))
                .Sum(iv => iv.PrecioTotal * v.ValorDolar));

        decimal SumarGananciaUSDExclAcc(IEnumerable<Venta> vv) =>
            vv.Sum(v => (v.ItemVenta ?? Enumerable.Empty<ItemVenta>())
                .Where(iv => !EsAccesorioLocal(iv))
                .Sum(iv => iv.Ganancia));

        decimal SumarGananciaAccesoriosARS(IEnumerable<Venta> vv) =>
            vv.Sum(v => (v.ItemVenta ?? Enumerable.Empty<ItemVenta>())
                .Where(iv => EsAccesorioLocal(iv))
                .Sum(iv => iv.Ganancia * v.ValorDolar));

        // Para secciones semanales (sólo si el mes seleccionado coincide con el actual)
        var ventasSemanalesRaw = (y == nowLocal.Year && m == nowLocal.Month)
            ? ventasMes.Where(v => v.Fecha >= inicioSemanaUtc).ToList()
            : new List<Venta>();

        var ventasMensualesRaw = ventasMes;

        // Gastos fijos (igual que antes)
        var gastosPesosARS = await _context.GastoFijo
            .Where(g => g.Tipo == TipoGasto.Pesos)
            .Select(g => (decimal?)g.Monto)
            .SumAsync() ?? 0m;

        var gastosDolaresUSD = await _context.GastoFijo
            .Where(g => g.Tipo == TipoGasto.Dolares)
            .Select(g => (decimal?)g.Monto)
            .SumAsync() ?? 0m;

        var totalGastosFijos = gastosPesosARS + gastosDolaresUSD;

        // Brutos
        var brutoSemanalUSD = SumarBrutoUSDExclAcc(ventasSemanalesRaw);
        var brutoSemanalARS = SumarBrutoARSExclAcc(ventasSemanalesRaw);
        var brutoSemanalAccesoriosARS = SumarBrutoAccesoriosARS(ventasSemanalesRaw);

        // ⚠️ Antes restabas gastos a los "brutos mensuales". Los dejo como estaban para compatibilidad…
        var brutoMensualUSD = SumarBrutoUSDExclAcc(ventasMensualesRaw) - gastosDolaresUSD;
        var brutoMensualARS = SumarBrutoARSExclAcc(ventasMensualesRaw);
        var brutoMensualAccesoriosARS = SumarBrutoAccesoriosARS(ventasMensualesRaw) - gastosPesosARS;

        // Ganancias (como antes)
        var gananciaMensualUSD = SumarGananciaUSDExclAcc(ventasMensualesRaw);
        var gananciaMensualAccesoriosARS = SumarGananciaAccesoriosARS(ventasMensualesRaw);

        var gananciaMensualNoAccNetaUSD = gananciaMensualUSD - gastosDolaresUSD;
        var gananciaMensualAccesoriosNetaARS = gananciaMensualAccesoriosARS - gastosPesosARS;
        var gananciaMensualUSDNeta = gananciaMensualNoAccNetaUSD;

        List<VentaListaDto> VentasToDto(IEnumerable<Venta> src) =>
            src.OrderByDescending(v => v.Fecha)
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
               .ToList();

        var ventasSemanales = VentasToDto(ventasSemanalesRaw);
        var ventasMensuales = VentasToDto(ventasMensualesRaw);

        // === NUEVO: Totales de VENTAS por bucket (SIN descontar gastos) ===
        var totalVentasNoAccesoriosUSD = Math.Round(SumarBrutoUSDExclAcc(ventasMensualesRaw), 2);
        var totalVentasAccesoriosARS = Math.Round(SumarBrutoAccesoriosARS(ventasMensualesRaw), 2);

        return Ok(new
        {
            ventasSemanales,
            ventasMensuales,

            // Brutos (compatibilidad)
            gananciaSemanalUSD = Math.Round(brutoSemanalUSD, 2),
            gananciaSemanalARS = Math.Round(brutoSemanalARS, 2),
            gananciaMensualUSD = Math.Round(brutoMensualUSD, 2),
            gananciaMensualARS = Math.Round(brutoMensualARS, 2),
            gananciaSemanalAccesoriosARS = Math.Round(brutoSemanalAccesoriosARS, 2),
            gananciaMensualAccesoriosARS = Math.Round(brutoMensualAccesoriosARS, 2),

            // Gastos
            gastosPesosARS = Math.Round(gastosPesosARS, 2),
            gastosDolaresUSD = Math.Round(gastosDolaresUSD, 2),
            totalGastosFijos = Math.Round(totalGastosFijos, 2),

            // Netos mensuales por bucket (compatibilidad)
            gananciaMensualNoAccNetaUSD = Math.Round(gananciaMensualNoAccNetaUSD, 2),
            gananciaMensualAccesoriosNetaARS = Math.Round(gananciaMensualAccesoriosNetaARS, 2),
            gananciaMensualUSDNeta = Math.Round(gananciaMensualUSDNeta, 2),

            // === NUEVO: Totales que necesita la UI de Ventas ===
            totalVentasNoAccesoriosUSD,
            totalVentasAccesoriosARS
        });
    }



    [HttpGet("bajostock")]
    public async Task<IActionResult> GetProductosBajoStock()
    {
        var productos = await _context.Productos
            .Where(p => p.StockActual <= p.StockMinimo)
            .ToListAsync();

        return Ok(productos);
    }
}
