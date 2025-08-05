using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using istockBack.Models;
using istockBack.DTOs;

namespace istockBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriasController : ControllerBase
    {
        private readonly IstockDbContext _context;

        public CategoriasController(IstockDbContext context)
        {
            _context = context;
        }

        // GET: api/categorias
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoriaDto>>> GetCategoria()
        {
            return await _context.Categoria
                .Select(c => new CategoriaDto
                {
                    IdCategoria = c.IdCategoria,
                    Nombre = c.Nombre
                })
                .ToListAsync();
        }

        // GET: api/categorias/5
        

        // POST: api/categorias
        [HttpPost]
        public async Task<ActionResult<CategoriaDto>> PostCategoria(CategoriaDto categoriaDto)
        {
            var categoria = new Categoria
            {
                Nombre = categoriaDto.Nombre
            };

            _context.Categoria.Add(categoria);
            await _context.SaveChangesAsync();

            categoriaDto.IdCategoria = categoria.IdCategoria;
            return CreatedAtAction(nameof(GetCategoria), new { id = categoria.IdCategoria }, categoriaDto);
        }

        // PUT: api/categorias/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCategoria(int id, CategoriaDto categoriaDto)
        {
            if (id != categoriaDto.IdCategoria)
                return BadRequest();

            var categoria = await _context.Categoria.FindAsync(id);
            if (categoria == null)
                return NotFound();

            categoria.Nombre = categoriaDto.Nombre;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/categorias/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategoria(int id)
        {
            var categoria = await _context.Categoria.FindAsync(id);
            if (categoria == null)
                return NotFound();

            _context.Categoria.Remove(categoria);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
