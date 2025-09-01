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

/* ============== Hosted services ============== */
builder.Services.AddHostedService<VentaBackupService>();
builder.Services.AddHostedService<VentaBackupMensualService>();

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
   En Azure poné App Setting: Swagger:Enabled = true (si querés exponerlo).
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
    // Que la raíz no dé 404
    app.MapGet("/", () => Results.Redirect("/swagger"));
}
else
{
    if (app.Environment.IsProduction()) app.UseHsts();
    // Al menos algo útil en raíz si Swagger está off
    app.MapGet("/", () => Results.Ok(new { ok = true, service = "iStock API" }));
}

/* ============ Forwarded headers (Azure) ============ */
var fwd = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
    RequireHeaderSymmetry = false
};
// Aceptar cualquier proxy (App Service front-ends)
fwd.KnownNetworks.Clear();
fwd.KnownProxies.Clear();
app.UseForwardedHeaders(fwd);

/* ============ Middlewares ============ */
app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.UseResponseCompression();
app.UseAuthentication();
app.UseAuthorization();

/* ============ Endpoints ============ */
app.MapGet("/healthz", () => Results.Ok(new { ok = true }));
app.MapControllers();

app.Run();
