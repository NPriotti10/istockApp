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
    public virtual DbSet<ItemCompra> ItemCompra { get; set; }
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

        modelBuilder.Entity<ItemCompra>(entity =>
        {
            entity.HasKey(e => e.IdItemCompra);

            entity.Property(e => e.IdItemCompra).HasColumnName("idItemCompra");
            entity.Property(e => e.Cantidad).HasColumnName("cantidad");
            entity.Property(e => e.IdProducto).HasColumnName("idProducto");
            entity.Property(e => e.IdCompra).HasColumnName("idCompra");

            entity.Property(e => e.PrecioUnitario)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("precioUnitario");

            entity.Property(e => e.PrecioTotal)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("precioTotal");

            

            // 👇 Acá definís la relación con Producto
            entity.HasOne(d => d.Producto)
                .WithMany(p => p.ItemCompra)
                .HasForeignKey(d => d.IdProducto)
                .OnDelete(DeleteBehavior.ClientSetNull);

            // 👇 También definís la relación con Compra
            entity.HasOne(d => d.Compra)
                .WithMany(p => p.ItemCompra)
                .HasForeignKey(d => d.IdCompra)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });



        modelBuilder.Entity<ItemVenta>(entity =>
        {
            entity.HasKey(e => e.IdItemVenta);

            entity.Property(e => e.IdItemVenta).HasColumnName("idItemVenta");
            entity.Property(e => e.Cantidad).HasColumnName("cantidad");
            entity.Property(e => e.IdProducto).HasColumnName("idProducto");
            entity.Property(e => e.IdVenta).HasColumnName("idVenta");

            entity.Property(e => e.PrecioUnitario)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("precioUnitario");

            entity.Property(e => e.PrecioTotal)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("precioTotal");

            entity.Property(e => e.Ganancia)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("ganancia");

            // 👇 Acá definís la relación con Producto
            entity.HasOne(d => d.Producto)
                .WithMany(p => p.ItemVenta)
                .HasForeignKey(d => d.IdProducto)
                .OnDelete(DeleteBehavior.ClientSetNull);

            // 👇 También definís la relación con Venta
            entity.HasOne(d => d.Venta)
                .WithMany(p => p.ItemVenta)
                .HasForeignKey(d => d.IdVenta)
                .OnDelete(DeleteBehavior.ClientSetNull);
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
            entity.HasOne(d => d.Categoria)
                .WithMany(p => p.Productos)
                .HasForeignKey(d => d.IdCategoria)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Producto_Categoria");


        });

        modelBuilder.Entity<Compra>(entity =>
        {
            entity.HasKey(e => e.IdCompra).HasName("PK__Compra__077D56142EEBE7DC");

            entity.Property(e => e.IdCompra).HasColumnName("idCompra");
            entity.Property(e => e.Proveedor)
                .HasMaxLength(100)
                .HasColumnName("proveedor");
            entity.Property(e => e.Fecha)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("fecha");
            
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
