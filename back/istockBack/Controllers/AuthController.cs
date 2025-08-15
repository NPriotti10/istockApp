using DocumentFormat.OpenXml.Math;
using istockBack.DTOs;
using istockBack.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using istockBack.Models; // Usuario, LoginDto, RegisterDto

namespace TuProyecto.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IstockDbContext _context;
        private readonly ITokenService _tokenService;

        public AuthController(IstockDbContext context, ITokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        // POST: api/Auth/register
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            if (await _context.Usuarios.AnyAsync(u => u.Username == model.Username))
                return BadRequest("El usuario ya existe");

            var usuario = new Usuario
            {
                Username = model.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password) // Encripta la contraseña
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Usuario registrado correctamente" });
        }

        // POST: api/Auth/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Username == model.Username);

            if (usuario == null || !BCrypt.Net.BCrypt.Verify(model.Password, usuario.PasswordHash))
                return Unauthorized("Usuario o contraseña inválidos");

            var token = _tokenService.GenerateToken(usuario);

            return Ok(new { token });
        }
    }
}
