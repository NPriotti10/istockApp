using ClosedXML.Excel;
using istockBack.Models;
using Microsoft.EntityFrameworkCore;

namespace istockBack.Services
{
    public class VentaBackupMensualService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<VentaBackupMensualService> _logger;
        private readonly string _backupPath = Path.Combine(Directory.GetCurrentDirectory(), "BackupMensual");

        public VentaBackupMensualService(IServiceScopeFactory scopeFactory, ILogger<VentaBackupMensualService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;

            if (!Directory.Exists(_backupPath))
                Directory.CreateDirectory(_backupPath);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            
            _logger.LogInformation("📁 Backup mensual generado: {time}", DateTime.Now);
            while (!stoppingToken.IsCancellationRequested)
            {
                var hoy = DateTime.Today;
                var mañana = hoy.AddDays(1);

                if (mañana.Day == 1) // Último día del mes
                {
                    try
                    {
                        await GenerarBackupMensual();
                        _logger.LogInformation("📁 Backup mensual generado: {time}", DateTime.Now);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ Error al generar backup mensual");
                    }
                }

                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }

        private async Task GenerarBackupMensual()
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IstockDbContext>();

            var inicioMes = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
            var ventas = await db.Venta
                .Include(v => v.ItemVenta)
                .ThenInclude(iv => iv.Producto)
                .Where(v => v.Fecha >= inicioMes)
                .ToListAsync();

            var gastosFijos = await db.GastoFijo.ToListAsync();
            var totalGastosFijos = gastosFijos.Sum(g => g.Monto);

            var workbook = new XLWorkbook();

            // 🧾 Hoja 1: Ventas
            var ventasSheet = workbook.Worksheets.Add("Ventas");
            ventasSheet.Cell(1, 1).Value = "ID Venta";
            ventasSheet.Cell(1, 2).Value = "Cliente";
            ventasSheet.Cell(1, 3).Value = "Fecha";
            ventasSheet.Cell(1, 4).Value = "Forma de Pago";
            ventasSheet.Cell(1, 5).Value = "Precio Total";
            ventasSheet.Cell(1, 6).Value = "Ganancia Total";
            ventasSheet.Cell(1, 7).Value = "Valor Dolar";
            ventasSheet.Cell(1, 8).Value = "Equipo Parte de Pago";

            int fila = 2;
            foreach (var venta in ventas)
            {
                ventasSheet.Cell(fila, 1).Value = venta.IdVenta;
                ventasSheet.Cell(fila, 2).Value = venta.Cliente;
                ventasSheet.Cell(fila, 3).Value = venta.Fecha;
                ventasSheet.Cell(fila, 4).Value = venta.FormaPago;
                ventasSheet.Cell(fila, 5).Value = venta.PrecioTotal;
                ventasSheet.Cell(fila, 6).Value = venta.GananciaTotal;
                ventasSheet.Cell(fila, 7).Value = venta.ValorDolar;
                ventasSheet.Cell(fila, 8).Value = venta.EquipoPartePago;
                fila++;
            }

            // 📦 Hoja 2: Detalles
            var detallesSheet = workbook.Worksheets.Add("Detalles");
            detallesSheet.Cell(1, 1).Value = "ID Venta";
            detallesSheet.Cell(1, 2).Value = "Producto";
            detallesSheet.Cell(1, 3).Value = "Cantidad";
            detallesSheet.Cell(1, 4).Value = "Precio Unitario";
            detallesSheet.Cell(1, 5).Value = "Precio Total";
            detallesSheet.Cell(1, 6).Value = "Ganancia";

            fila = 2;
            foreach (var venta in ventas)
            {
                foreach (var item in venta.ItemVenta)
                {
                    detallesSheet.Cell(fila, 1).Value = venta.IdVenta;
                    detallesSheet.Cell(fila, 2).Value = item.Producto?.Nombre ?? "Sin nombre";
                    detallesSheet.Cell(fila, 3).Value = item.Cantidad;
                    detallesSheet.Cell(fila, 4).Value = item.PrecioUnitario;
                    detallesSheet.Cell(fila, 5).Value = item.PrecioTotal;
                    detallesSheet.Cell(fila, 6).Value = item.Ganancia;
                    fila++;
                }
            }

            // 📊 Hoja 3: Estadísticas
            var estadSheet = workbook.Worksheets.Add("Estadísticas");

            decimal gananciaUSD = ventas.Sum(v => v.GananciaTotal);
            decimal gananciaARS = ventas.Sum(v => v.GananciaTotal * v.ValorDolar);
            decimal gananciaNetaUSD = gananciaUSD - totalGastosFijos;

            estadSheet.Cell(1, 1).Value = "Métrica";
            estadSheet.Cell(1, 2).Value = "Valor";

            estadSheet.Cell(2, 1).Value = "Ganancia Total (ARS)";
            estadSheet.Cell(2, 2).Value = gananciaARS;

            estadSheet.Cell(3, 1).Value = "Ganancia Total (USD)";
            estadSheet.Cell(3, 2).Value = gananciaUSD;

            estadSheet.Cell(4, 1).Value = "Gastos Fijos (USD)";
            estadSheet.Cell(4, 2).Value = totalGastosFijos;

            estadSheet.Cell(5, 1).Value = "Ganancia Neta (USD)";
            estadSheet.Cell(5, 2).Value = gananciaNetaUSD;

            estadSheet.Cell(6, 1).Value = "Ganancia Neta (ARS)";
            estadSheet.Cell(6, 2).Value = gananciaNetaUSD * (ventas.Average(v => v.ValorDolar));

            string fileName = $"backup_mensual_{DateTime.Now:yyyyMM}_ventas.xlsx";
            workbook.SaveAs(Path.Combine(_backupPath, fileName));
        }
    }
}
