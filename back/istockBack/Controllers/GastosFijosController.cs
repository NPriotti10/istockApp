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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<GastoFijo>>> GetGastosFijos()
        {
            return await _context.GastoFijo.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<GastoFijo>> GetGastoFijo(int id)
        {
            var gasto = await _context.GastoFijo.FindAsync(id);
            if (gasto == null) return NotFound();
            return gasto;
        }

        [HttpPost]
        public async Task<ActionResult<GastoFijo>> PostGastoFijo(GastoFijo gasto)
        {
            _context.GastoFijo.Add(gasto);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetGastoFijo), new { id = gasto.Id }, gasto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutGastoFijo(int id, GastoFijo gasto)
        {
            if (id != gasto.Id) return BadRequest();
            _context.Entry(gasto).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGastoFijo(int id)
        {
            var gasto = await _context.GastoFijo.FindAsync(id);
            if (gasto == null) return NotFound();
            _context.GastoFijo.Remove(gasto);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
