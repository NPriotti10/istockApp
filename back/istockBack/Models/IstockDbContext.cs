using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace istockBack.Models;

public partial class IstockDbContext : DbContext
{
    public IstockDbContext()
    {
    }

    public IstockDbContext(DbContextOptions<IstockDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Categoria> Categoria { get; set; }


    public virtual DbSet<Compra> Compra { get; set; }
    public virtual DbSet<ItemVenta> ItemVenta { get; set; }

    public virtual DbSet<Producto> Productos { get; set; }
    public virtual DbSet<Usuario> Usuarios { get; set; }

    public virtual DbSet<Venta> Venta { get; set; }
    public virtual DbSet<GastoFijo> GastoFijo { get; set; }


    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {

    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.HasKey(e => e.IdCategoria).HasName("PK__Categori__8A3D240C8DF57A7A");

            entity.Property(e => e.IdCategoria).HasColumnName("idCategoria");
            entity.Property(e => e.Nombre)
                .HasMaxLength(50)
                .HasColumnName("nombre");
        });

        modelBuilder.Entity<Usuario>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.Username).IsRequired().HasMaxLength(100);
            e.HasIndex(u => u.Username).IsUnique();
            e.Property(u => u.PasswordHash).IsRequired().HasMaxLength(200);
        });

        // ⛔️ ELIMINAR





        modelBuilder.Entity<ItemVenta>(entity =>
        {
            entity.HasKey(e => e.IdItemVenta);

            entity.Property(e => e.IdItemVenta).HasColumnName("idItemVenta");
            entity.Property(e => e.IdVenta).HasColumnName("idVenta");

            // FK a Producto: columna nullable para poder hacer SetNull al borrar el producto
            entity.Property(e => e.IdProducto)
                .HasColumnName("idProducto");

            entity.Property(e => e.Cantidad).HasColumnName("cantidad");

            entity.Property(e => e.NumeroSerie)
                .HasMaxLength(200)
                .HasColumnName("numeroSerie");

            // Importes en USD con dos decimales
            entity.Property(e => e.PrecioUnitario)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("precioUnitario");

            entity.Property(e => e.CostoUnitario)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("costoUnitario");

            entity.Property(e => e.PrecioTotal)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("precioTotal");

            entity.Property(e => e.Ganancia)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("ganancia");

            // SNAPSHOTS del producto al momento de la venta
            entity.Property(e => e.NombreProducto)
                .HasMaxLength(300)
                .HasColumnName("nombreProducto");

            entity.Property(e => e.CodigoBarra)
                .HasMaxLength(100)
                .HasColumnName("codigoBarra");

            entity.Property(e => e.CategoriaNombre)
                .HasMaxLength(200)
                .HasColumnName("categoriaNombre");

            // Relación con Venta: si se borra la venta, se borran sus items
            entity.HasOne(d => d.Venta)
                .WithMany(p => p.ItemVenta)
                .HasForeignKey(d => d.IdVenta)
                .OnDelete(DeleteBehavior.Cascade);

            // Relación con Producto: opcional; al borrar el producto, se pone NULL en la FK
            entity.HasOne(d => d.Producto)
                .WithMany(p => p.ItemVenta)
                .HasForeignKey(d => d.IdProducto)
                .OnDelete(DeleteBehavior.SetNull);
        });




        modelBuilder.Entity<Producto>(entity =>
        {
            entity.HasKey(e => e.IdProducto).HasName("PK__Producto__07F4A13281069226");

            entity.ToTable("Producto");

            entity.Property(e => e.IdProducto).HasColumnName("idProducto");
            entity.Property(e => e.Descripcion)
                .HasMaxLength(255)
                .HasColumnName("descripcion");
            entity.Property(e => e.IdCategoria).HasColumnName("idCategoria");
            entity.Property(e => e.Nombre)
                .HasMaxLength(50)
                .HasColumnName("nombre");
            entity.Property(e => e.PrecioCosto)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("precioCosto");
            entity.Property(e => e.PrecioVenta)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("precioVenta");
            entity.Property(e => e.StockActual).HasColumnName("stockActual");
            entity.Property(e => e.StockMinimo).HasColumnName("stockMinimo");

            // ✅ NUEVO: columna de código de barras
            entity.Property(e => e.CodigoBarra)
                .HasMaxLength(64)
                .IsUnicode(false)
                .HasColumnName("codigoBarra");

            // ✅ NUEVO: índice único filtrado (permite varios NULL)
            entity.HasIndex(e => e.CodigoBarra)
                .IsUnique()
                .HasDatabaseName("UX_Producto_CodigoBarra")
                .HasFilter("[codigoBarra] IS NOT NULL");

            entity.HasOne(d => d.Categoria)
                .WithMany(p => p.Productos)
                .HasForeignKey(d => d.IdCategoria)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Producto_Categoria");
        });


        modelBuilder.Entity<Compra>(entity =>
        {
            entity.ToTable("Compra");

            entity.HasKey(e => e.IdCompra)
                  .HasName("PK__Compra__077D56142EEBE7DC");

            entity.Property(e => e.IdCompra)
                  .HasColumnName("idCompra");

            entity.Property(e => e.Proveedor)
                  .HasMaxLength(100)
                  .HasColumnName("proveedor");

            entity.Property(e => e.Fecha)
                  .HasColumnType("datetime")
                  .HasDefaultValueSql("GETDATE()")
                  .HasColumnName("fecha");

            // ✅ Total con precisión
            entity.Property(e => e.PrecioTotal)
                  .HasColumnType("decimal(18, 2)")
                  .HasColumnName("precioTotal");

            // ✅ Ítems serializados como JSON
            entity.Property(e => e.ItemsJson)
                  .HasColumnType("nvarchar(max)")
                  .HasColumnName("itemsJson");

            // Si NO marcaste la prop .Items con [NotMapped], descomenta:
            // entity.Ignore(e => e.Items);
        });


        modelBuilder.Entity<Venta>(entity =>
        {
            entity.HasKey(e => e.IdVenta).HasName("PK__Venta__077D56142EEBE7DC");

            entity.Property(e => e.IdVenta).HasColumnName("idVenta");
            entity.Property(e => e.Cliente)
                .HasMaxLength(100)
                .HasColumnName("cliente");
            entity.Property(e => e.Fecha)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("fecha");
            entity.Property(e => e.FormaPago)
                .HasMaxLength(50)
                .HasColumnName("formaPago");
            
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
