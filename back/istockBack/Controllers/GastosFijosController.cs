using System.ComponentModel.DataAnnotations;
using istockBack.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace istockBack.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class GastosFijosController : ControllerBase
    {
        private readonly IstockDbContext _context;

        public GastosFijosController(IstockDbContext context)
        {
            _context = context;
        }

        // =========================
        // DTOs
        // =========================
        public class GastoFijoDto
        {
            public int Id { get; set; }

            [Required, MinLength(2)]
            public string Nombre { get; set; } = string.Empty;

            [Range(0.01, double.MaxValue, ErrorMessage = "El monto debe ser mayor a 0.")]
            public decimal Monto { get; set; }

            [Required]
            public TipoGasto Tipo { get; set; } // Pesos / Dolares
        }

        public class CreateGastoFijoDto
        {
            [Required, MinLength(2)]
            public string Nombre { get; set; } = string.Empty;

            [Range(0.01, double.MaxValue, ErrorMessage = "El monto debe ser mayor a 0.")]
            public decimal Monto { get; set; }

            [Required]
            public TipoGasto Tipo { get; set; }
        }

        // =========================
        // Helpers de mapeo
        // =========================
        private static GastoFijoDto ToDto(GastoFijo e) => new()
        {
            Id = e.Id,
            Nombre = e.Nombre,
            Monto = e.Monto,
            Tipo = e.Tipo
        };

        private static void ApplyDto(GastoFijo entity, GastoFijoDto dto)
        {
            entity.Nombre = dto.Nombre?.Trim() ?? entity.Nombre;
            entity.Monto = dto.Monto;
            entity.Tipo = dto.Tipo;
        }

        private static void ApplyCreateDto(GastoFijo entity, CreateGastoFijoDto dto)
        {
            entity.Nombre = dto.Nombre?.Trim() ?? string.Empty;
            entity.Monto = dto.Monto;
            entity.Tipo = dto.Tipo;
        }

        // =========================
        // Endpoints principales
        // =========================

        // GET: api/GastosFijos
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<GastoFijoDto>>> GetGastosFijos()
        {
            var list = await _context.GastoFijo
                .AsNoTracking()
                .OrderBy(g => g.Nombre)
                .ToListAsync();

            return Ok(list.Select(ToDto));
        }

        // GET: api/GastosFijos/5
        [HttpGet("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<GastoFijoDto>> GetGastoFijo(int id)
        {
            var gasto = await _context.GastoFijo.AsNoTracking().FirstOrDefaultAsync(g => g.Id == id);
            if (gasto == null) return NotFound();

            return Ok(ToDto(gasto));
        }

        // POST: api/GastosFijos
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<GastoFijoDto>> PostGastoFijo([FromBody] CreateGastoFijoDto dto)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            if (!Enum.IsDefined(typeof(TipoGasto), dto.Tipo))
                return BadRequest("Tipo de gasto inválido.");

            var entity = new GastoFijo();
            ApplyCreateDto(entity, dto);

            _context.GastoFijo.Add(entity);
            await _context.SaveChangesAsync();

            var result = ToDto(entity);
            return CreatedAtAction(nameof(GetGastoFijo), new { id = entity.Id }, result);
        }

        // PUT: api/GastosFijos/5
        [HttpPut("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> PutGastoFijo(int id, [FromBody] GastoFijoDto dto)
        {
            if (id != dto.Id) return BadRequest("El id del URL no coincide con el del body.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var entity = await _context.GastoFijo.FirstOrDefaultAsync(g => g.Id == id);
            if (entity == null) return NotFound();

            if (!Enum.IsDefined(typeof(TipoGasto), dto.Tipo))
                return BadRequest("Tipo de gasto inválido.");

            ApplyDto(entity, dto);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/GastosFijos/5
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteGastoFijo(int id)
        {
            var gasto = await _context.GastoFijo.FindAsync(id);
            if (gasto == null) return NotFound();

            _context.GastoFijo.Remove(gasto);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // =========================
        // NUEVO: Cerrar mes
        // =========================
        [HttpPost("cerrar-mes")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> CerrarMes()
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById(
#if WINDOWS
                "Argentina Standard Time"
#else
                "America/Argentina/Cordoba"
#endif
            );

            var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
            var y = nowLocal.Year;
            var m = nowLocal.Month;

            var gastos = await _context.GastoFijo.ToListAsync();
            if (!gastos.Any())
                return Ok(new { message = "No hay gastos fijos para cerrar." });

            var historicos = gastos.Select(g => new GastoFijoHistorico
            {
                Nombre = g.Nombre,
                Monto = g.Monto,
                Tipo = g.Tipo,
                Año = y,
                Mes = m
            }).ToList();

            _context.GastoFijoHistorico.AddRange(historicos);
            _context.GastoFijo.RemoveRange(gastos);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Gastos fijos cerrados y reiniciados correctamente ({m:00}/{y})." });
        }

        // =========================
        // NUEVO: Histórico
        // =========================
        [HttpGet("historico")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetHistorico()
        {
            var historico = await _context.GastoFijoHistorico
                .AsNoTracking()
                .OrderByDescending(g => g.Año)
                .ThenByDescending(g => g.Mes)
                .ThenBy(g => g.Nombre)
                .ToListAsync();

            return Ok(historico);
        }
    }
}
