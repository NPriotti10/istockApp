using istockBack.Models;
using istockBack.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Cryptography;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// CORS para el front (Vite)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy => policy
        .WithOrigins("http://localhost:5173") // ajustá si cambia
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

// MVC + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "iStock API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Ingrese: Bearer {token}"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// Hosted services (los que ya tenías)
builder.Services.AddHostedService<VentaBackupService>();
builder.Services.AddHostedService<VentaBackupMensualService>();

// DbContext
builder.Services.AddDbContext<IstockDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("CadenaSQL"));
});

// JWT (permite passphrase corta derivando a 32 bytes con SHA-256)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var cfg = builder.Configuration;
        var passphrase = cfg["Jwt:Key"] ?? throw new InvalidOperationException("Falta Jwt:Key en appsettings.json");
        var keyBytes = SHA256.HashData(Encoding.UTF8.GetBytes(passphrase)); // clave fuerte desde tu passphrase

        options.TokenValidationParameters = new()
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = cfg["Jwt:Issuer"],
            ValidAudience = cfg["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes)
        };
    });

builder.Services.AddAuthorization();

// Token service (usar SIEMPRE la interfaz)
builder.Services.AddScoped<ITokenService, TokenService>();

var app = builder.Build();

// Swagger (dejalo siempre o sólo en Dev, como prefieras)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();

app.UseAuthentication();   // ? importante: antes de Authorization
app.UseAuthorization();

app.MapControllers();

app.Run();
