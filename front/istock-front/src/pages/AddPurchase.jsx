import React, { useEffect, useState } from "react";
import { getProductsPaged } from "../services/products";
import { createPurchase } from "../services/purchases";
import { useNavigate } from "react-router-dom";

export default function AddPurchase() {
  const [productos, setProductos] = useState([]);
  const [items, setItems] = useState([]); // { idProducto, cantidad }
  const [proveedor, setProveedor] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [busqueda, setBusqueda] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    getProductsPaged({ page: 1, pageSize: 9999 })
      .then((res) => setProductos(res.items || res || []))
      .catch(() => alert("Error al obtener productos"));
  }, []);

  // Agregar ítem desde el buscador (si ya existe, solo suma 1)
  const handleAddItemFromSearch = (producto) => {
    setItems((prev) => {
      const i = prev.findIndex((it) => it.idProducto === producto.idProducto);
      if (i === -1) return [...prev, { idProducto: producto.idProducto, cantidad: 1 }];
      return prev.map((it, idx) =>
        idx === i ? { ...it, cantidad: it.cantidad + 1 } : it
      );
    });
    setBusqueda("");
  };

  // Cambiar cantidad de un ítem por índice (siempre >= 1)
  const handleChangeCantidad = (index, value) => {
    const cantidad = Math.max(1, Number(value) || 1);
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, cantidad } : it))
    );
  };

  // Incrementar / Decrementar
  const handleIncrement = (index) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, cantidad: it.cantidad + 1 } : it))
    );
  };

  const handleDecrement = (index) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, cantidad: Math.max(1, it.cantidad - 1) } : it
      )
    );
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    let total = 0;
    items.forEach(({ idProducto, cantidad }) => {
      const producto = productos.find((p) => p.idProducto === Number(idProducto));
      if (producto) {
        // Para compras, priorizamos costo si está disponible
        const precio = producto.precioCosto ?? producto.precioVenta ?? 0;
        total += precio * cantidad;
      }
    });
    return { total };
  };

  const validar = () => {
    if (items.length === 0) {
      alert("Agregá al menos un producto.");
      return false;
    }
    // Chequeos básicos
    for (const it of items) {
      const prod = productos.find((p) => p.idProducto === Number(it.idProducto));
      if (!prod) {
        alert("Hay un producto inválido en la lista.");
        return false;
      }
      if (!Number.isFinite(it.cantidad) || it.cantidad < 1) {
        alert("La cantidad debe ser un número válido mayor o igual a 1.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    if (!confirm("¿Estás seguro de guardar esta compra?")) return;

    const compra = {
      fecha,
      proveedor,
      items: items.map(({ idProducto, cantidad }) => ({
        idProducto: Number(idProducto),
        cantidad: Number(cantidad),
      })),
    };

    try {
      await createPurchase(compra);
      alert("✅ Compra registrada con éxito");
      navigate("/compras");
    } catch (err) {
      console.error("Error al guardar la compra:", err);
      alert("❌ Ocurrió un error al registrar la compra");
    }
  };

  const { total } = calcularTotal();

  const productosFiltrados = productos.filter((p) =>
    (p.nombre || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  const styles = {
    container: {
      padding: 24,
      maxWidth: 700,
      margin: "0 auto",
      background: "#f9f9f9",
      borderRadius: 12,
      boxShadow: "0 0 10px rgba(0,0,0,0.1)",
      position: "relative",
    },
    formGroup: {
      marginBottom: 16,
      display: "flex",
      flexDirection: "column",
    },
    label: {
      marginBottom: 6,
      fontWeight: "bold",
    },
    input: {
      padding: 8,
      border: "1px solid #ccc",
      borderRadius: 6,
    },
    button: {
      padding: "8px 12px",
      background: "#007bff",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      cursor: "pointer",
      fontWeight: "bold",
    },
    removeBtn: {
      background: "#dc3545",
    },
    dropdown: {
      border: "1px solid #ccc",
      borderRadius: 4,
      maxHeight: 140,
      overflowY: "auto",
      backgroundColor: "#fff",
      position: "absolute",
      zIndex: 999,
      width: "calc(100% - 16px)",
    },
    dropdownItem: {
      padding: 8,
      cursor: "pointer",
    },
    cantidadInput: {
      width: 60,
      textAlign: "center",
      padding: 8,
      border: "1px solid #ccc",
      borderRadius: 6,
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Nueva Compra</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Fecha:</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Proveedor:</label>
          <input
            type="text"
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <hr style={{ margin: "24px 0" }} />

        <h3>Productos</h3>

        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ ...styles.input, marginBottom: 8 }}
          />
          {busqueda && (
            <div style={styles.dropdown}>
              {productosFiltrados.map((p) => (
                <div
                  key={p.idProducto}
                  style={styles.dropdownItem}
                  onClick={() => handleAddItemFromSearch(p)}
                >
                  {p.nombre} (Stock: {p.stockActual ?? 0})
                </div>
              ))}
            </div>
          )}
        </div>

        {items.map((item, index) => {
          const producto = productos.find((p) => p.idProducto === item.idProducto);
          return (
            <div
              key={`${item.idProducto}-${index}`}
              style={{ marginTop: 16, borderBottom: "1px solid #ccc", paddingBottom: 8 }}
            >
              <div><strong>{producto?.nombre ?? "Producto"}</strong></div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <button type="button" onClick={() => handleDecrement(index)} style={styles.button}>-</button>
                <input
                  type="number"
                  min={1}
                  value={item.cantidad}
                  onChange={(e) => handleChangeCantidad(index, e.target.value)}
                  style={styles.cantidadInput}
                />
                <button type="button" onClick={() => handleIncrement(index)} style={styles.button}>+</button>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  style={{ ...styles.button, ...styles.removeBtn }}
                >
                  ❌ Eliminar
                </button>
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: 16 }}>
          <strong>Total USD:</strong> ${total.toFixed(2)}
        </div>

        <button type="submit" style={{ ...styles.button, marginTop: 24 }}>
          Guardar Compra
        </button>
      </form>
    </div>
  );
}
