using istockBack.Models;
using istockBack.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

/* ==================== CORS ==================== */
// Permite configurar como string en App Settings: Cors:AllowedOrigins = "https://istockapp.netlify.app;http://localhost:5173"
var originsRaw = builder.Configuration["Cors:AllowedOrigins"];
var allowedOrigins =
    !string.IsNullOrWhiteSpace(originsRaw)
        ? originsRaw.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        : (builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
           ?? new[] { "http://localhost:5173", "https://istockapp.netlify.app" });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

/* ============== Controllers / JSON ============== */
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();

/* =================== Swagger =================== */
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
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});



/* ================== DbContext ================== */
builder.Services.AddDbContext<IstockDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("CadenaSQL"));
});

/* ====================== JWT ====================== */
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var cfg = builder.Configuration;
        var passphrase = cfg["Jwt:Key"] ?? throw new InvalidOperationException("Falta Jwt:Key en appsettings.");
        var keyBytes = SHA256.HashData(Encoding.UTF8.GetBytes(passphrase));

        var issuer = cfg["Jwt:Issuer"];
        var audience = cfg["Jwt:Audience"];

        options.TokenValidationParameters = new()
        {
            // Si issuer/audience no están configurados, no los validamos (útil en dev/local)
            ValidateIssuer = !string.IsNullOrWhiteSpace(issuer),
            ValidateAudience = !string.IsNullOrWhiteSpace(audience),
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ClockSkew = TimeSpan.FromMinutes(2) // tolerancia razonable para diferencias de reloj
        };
    });

builder.Services.AddAuthorization();

/* ================== Token service ================== */
builder.Services.AddScoped<ITokenService, TokenService>();

/* ================== Compresión ================== */
builder.Services.AddResponseCompression(o =>
{
    o.EnableForHttps = true;
    o.Providers.Add<GzipCompressionProvider>();
});
builder.Services.Configure<GzipCompressionProviderOptions>(o =>
{
    o.Level = CompressionLevel.Fastest;
});

var app = builder.Build();

/* ===== Swagger controlado por config =====
   En Azure podés setear App Setting: Swagger:Enabled = true (si querés exponer UI).
   Por defecto: Dev = true, Prod = false. */
var swaggerEnabled = builder.Configuration.GetValue("Swagger:Enabled", app.Environment.IsDevelopment());
if (swaggerEnabled)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "iStock API v1");
        c.RoutePrefix = "swagger";
    });
    // Redirigir la raíz a Swagger si está habilitado
    app.MapGet("/", () => Results.Redirect("/swagger"));
}
else
{
    // HSTS siempre en producción (más consistente)
    if (app.Environment.IsProduction()) app.UseHsts();

    // Respuesta simple en raíz si Swagger está deshabilitado
    app.MapGet("/", () => Results.Ok(new { ok = true, service = "iStock API" }));
}

/* ============ Forwarded headers (Azure) ============ */
var fwd = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
    RequireHeaderSymmetry = false
};
fwd.KnownNetworks.Clear();
fwd.KnownProxies.Clear();
app.UseForwardedHeaders(fwd);

/* ============ Orden de middlewares recomendado ============ */
// 1) HTTPS / HSTS (HSTS ya se activa arriba cuando corresponde)
app.UseHttpsRedirection();

// 2) Compresión
app.UseResponseCompression();

// 3) Enrutamiento explícito para ubicar CORS en el lugar correcto
app.UseRouting();

// 4) CORS SIEMPRE entre UseRouting y UseAuthorization/UseEndpoints
app.UseCors("AllowFrontend");

// 5) AuthN / AuthZ
app.UseAuthentication();
app.UseAuthorization();

/* ============ Migración automática en Development ============ */
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<IstockDbContext>();
    // Intenta aplicar migraciones pendientes al iniciar en local (no en producción)
    db.Database.Migrate();
}

/* ============ Endpoints ============ */
app.MapGet("/healthz", () => Results.Ok(new { ok = true }));
app.MapControllers();

app.Run();
