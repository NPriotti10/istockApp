// File: Services/VentaBackupService.cs
using ClosedXML.Excel;
using istockBack.Models;
using Microsoft.EntityFrameworkCore;

namespace istockBack.Services
{
    public class VentaBackupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<VentaBackupService> _logger;
        private readonly string _backupPath = Path.Combine(Directory.GetCurrentDirectory(), "BackupSemanal");

        public VentaBackupService(IServiceScopeFactory scopeFactory, ILogger<VentaBackupService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;

            if (!Directory.Exists(_backupPath))
                Directory.CreateDirectory(_backupPath);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await GenerarBackup();
                    _logger.LogInformation("Backup generado correctamente: {time}", DateTime.Now);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al generar backup de ventas");
                }

                await Task.Delay(TimeSpan.FromDays(7), stoppingToken); // Espera 1 semana
            }
        }

        private async Task GenerarBackup()
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IstockDbContext>();

            var ventas = await db.Venta
                .Include(v => v.ItemVenta)
                .ThenInclude(iv => iv.Producto)
                .ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Ventas");

            worksheet.Cell(1, 1).Value = "ID Venta";
            worksheet.Cell(1, 2).Value = "Cliente";
            worksheet.Cell(1, 3).Value = "Fecha";
            worksheet.Cell(1, 4).Value = "Forma de Pago";
            worksheet.Cell(1, 5).Value = "Precio Total";
            worksheet.Cell(1, 6).Value = "Ganancia Total";
            worksheet.Cell(1, 7).Value = "Valor Dolar";
            worksheet.Cell(1, 8).Value = "Equipo Parte de Pago";

            int row = 2;
            foreach (var venta in ventas)
            {
                worksheet.Cell(row, 1).Value = venta.IdVenta;
                worksheet.Cell(row, 2).Value = venta.Cliente;
                worksheet.Cell(row, 3).Value = venta.Fecha;
                worksheet.Cell(row, 4).Value = venta.FormaPago;
                worksheet.Cell(row, 5).Value = venta.PrecioTotal;
                worksheet.Cell(row, 6).Value = venta.GananciaTotal;
                worksheet.Cell(row, 7).Value = venta.ValorDolar;
                worksheet.Cell(row, 8).Value = venta.EquipoPartePago;
                row++;
            }

            // 🧾 Hoja 2: Detalles de cada producto vendido
            var detalleSheet = workbook.Worksheets.Add("Detalles");

            detalleSheet.Cell(1, 1).Value = "ID Venta";
            detalleSheet.Cell(1, 2).Value = "Producto";
            detalleSheet.Cell(1, 3).Value = "Cantidad";
            detalleSheet.Cell(1, 4).Value = "Precio Unitario";
            detalleSheet.Cell(1, 5).Value = "Precio Total";
            detalleSheet.Cell(1, 6).Value = "Ganancia";

            int fila = 2;
            foreach (var venta in ventas)
            {
                foreach (var item in venta.ItemVenta)
                {
                    detalleSheet.Cell(fila, 1).Value = venta.IdVenta;
                    detalleSheet.Cell(fila, 2).Value = item.Producto?.Nombre ?? "Sin nombre";
                    detalleSheet.Cell(fila, 3).Value = item.Cantidad;
                    detalleSheet.Cell(fila, 4).Value = item.PrecioUnitario;
                    detalleSheet.Cell(fila, 5).Value = item.PrecioTotal;
                    detalleSheet.Cell(fila, 6).Value = item.Ganancia;
                    fila++;
                }
            }

            string fileName = $"backup_ventas_semanal_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
            workbook.SaveAs(Path.Combine(_backupPath, fileName));
        }
    }
}
