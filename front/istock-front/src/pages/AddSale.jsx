import React, { useEffect, useState } from "react";
import { getProductsPaged } from "../services/products";
import { createSale } from "../services/sales";
import { getDolarValue } from "../services/dolar";
import { useNavigate } from "react-router-dom";

export default function AddSale() {
  const [productos, setProductos] = useState([]);
  const [items, setItems] = useState([]); // { idProducto, cantidad, numeroSerie }
  const [cliente, setCliente] = useState("");
  const [formaPago, setFormaPago] = useState("");
  const [valorDolar, setValorDolar] = useState("");
  const [equipoPartePago, setEquipoPartePago] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [busqueda, setBusqueda] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    getProductsPaged({ page: 1, pageSize: 9999 })
      .then((res) => setProductos(res.items || res))
      .catch(() => alert("Error al obtener productos"));

    getDolarValue()
      .then(setValorDolar)
      .catch(() => {
        console.warn("No se pudo obtener el valor del dólar");
        setValorDolar(0);
      });
  }, []);

  const handleAddItemFromSearch = (producto) => {
    setItems((prev) => [
      ...prev,
      { idProducto: producto.idProducto, cantidad: 1, numeroSerie: "" },
    ]);
    setBusqueda("");
  };

  const handleChangeCantidad = (index, value) => {
    const nuevos = [...items];
    const producto = productos.find(p => p.idProducto === Number(nuevos[index].idProducto));
    const cantidad = Math.max(1, Number(value) || 1);

    if (producto && cantidad > producto.stockActual) {
      alert(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stockActual}`);
      return;
    }

    nuevos[index].cantidad = cantidad;
    setItems(nuevos);
  };

  const handleIncrement = (index) => {
    handleChangeCantidad(index, items[index].cantidad + 1);
  };

  const handleDecrement = (index) => {
    handleChangeCantidad(index, items[index].cantidad - 1);
  };

  const handleRemoveItem = (index) => {
    const nuevos = [...items];
    nuevos.splice(index, 1);
    setItems(nuevos);
  };

  const handleSerieChange = (index, valor) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index].numeroSerie = valor;
      return copy;
    });
  };

  const calcularTotalYGanancia = () => {
    let total = 0;
    let ganancia = 0;
    let totalARS = 0;

    items.forEach(({ idProducto, cantidad }) => {
      const producto = productos.find((p) => p.idProducto === Number(idProducto));
      if (producto) {
        total += (producto.precioVenta ?? 0) * cantidad;
        const costo = producto.precioCosto ?? 0;
        const venta = producto.precioVenta ?? 0;
        ganancia += (venta - costo) * cantidad;
        totalARS = total * (valorDolar || 1);
      }
    });

    return { total, ganancia, totalARS };
  };

  const validar = () => {
    if (items.length === 0) {
      alert("Agregá al menos un producto.");
      return false;
    }

    for (const it of items) {
      const producto = productos.find((p) => p.idProducto === Number(it.idProducto));
      if (!producto) continue;

      // Validar número de serie presente (siempre requerido)
      if (!String(it.numeroSerie || "").trim()) {
        alert(`Ingresá el número de serie para "${producto.nombre}".`);
        return false;
      }

      // Validar stock
      if (it.cantidad > (producto.stockActual ?? 0)) {
        alert(`Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stockActual}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    if (!confirm("¿Estás seguro de guardar esta venta?")) return;

    const venta = {
      fecha,
      cliente,
      formaPago,
      valorDolar: parseFloat(valorDolar),
      equipoPartePago,
      items: items.map(({ idProducto, cantidad, numeroSerie }) => ({
        // nombrá las props como las espera tu backend
        idProducto: Number(idProducto),     // o "productoId" si tu API lo pide así
        cantidad: Number(cantidad),
        numeroSerie: String(numeroSerie).trim(),
      })),
    };

    try {
      await createSale(venta);
      alert("✅ Venta registrada con éxito");
      navigate("/ventas");
    } catch (err) {
      console.error("Error al guardar la venta:", err);
      alert("❌ Ocurrió un error al registrar la venta");
    }
  };

  const { total, ganancia, totalARS } = calcularTotalYGanancia();

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
    serialInput: {
      display: "block",
      marginTop: 8,
      padding: 8,
      border: "1px solid #ccc",
      borderRadius: 6,
      width: 260,
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Nueva Venta</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Fecha:</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={styles.input} required />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Cliente:</label>
          <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} style={styles.input} required />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Forma de Pago:</label>
          <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)} style={styles.input} required>
            <option value="">Seleccionar</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Valor del dólar:</label>
          <input type="number" step="0.01" value={valorDolar} onChange={(e) => setValorDolar(e.target.value)} style={styles.input} required />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Equipo tomado como parte de pago:</label>
          <input
            type="text"
            value={equipoPartePago}
            onChange={(e) => setEquipoPartePago(e.target.value)}
            style={styles.input}
            placeholder="Ej: iPhone 13 Black - 85% Bat - 64gb"
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
                  {p.nombre} (Stock: {p.stockActual})
                </div>
              ))}
            </div>
          )}
        </div>

        {items.map((item, index) => {
          const producto = productos.find(p => p.idProducto === item.idProducto);
          return (
            <div key={index} style={{ marginTop: 16, borderBottom: "1px solid #ccc", paddingBottom: 8 }}>
              <div><strong>{producto?.nombre}</strong></div>

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
                <button type="button" onClick={() => handleRemoveItem(index)} style={{ ...styles.button, ...styles.removeBtn }}>❌ Eliminar</button>
              </div>

              {/* Único input de N° de serie por ítem */}
              <input
                type="text"
                placeholder="Número de serie"
                value={item.numeroSerie || ""}
                onChange={(e) => handleSerieChange(index, e.target.value)}
                style={styles.serialInput}
              />
            </div>
          );
        })}

        <div style={{ marginTop: 16 }}>
          <strong>Total USD:</strong> ${total.toFixed(2)} <br />
          <strong>Total ARS:</strong> ${totalARS.toFixed(2)} <br /> 
          <strong>Ganancia:</strong> ${ganancia.toFixed(2)}
        </div>

        <button type="submit" style={{ ...styles.button, marginTop: 24 }}>
          Guardar Venta
        </button>
      </form>
    </div>
  );
}
