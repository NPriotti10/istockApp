import React, { useEffect, useState } from "react";
import { getAllProducts } from "../services/products";
import { createSale } from "../services/sales";
import { getDolarValue } from "../services/dolar";
import { useNavigate } from "react-router-dom";

export default function AddSale() {
  const [productos, setProductos] = useState([]);
  const [items, setItems] = useState([]);
  const [cliente, setCliente] = useState("");
  const [formaPago, setFormaPago] = useState("");
  const [valorDolar, setValorDolar] = useState("");
  const [equipoPartePago, setEquipoPartePago] = useState("");
  const [fecha, setFecha] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split("T")[0];
  });
  const navigate = useNavigate();

  useEffect(() => {
    getAllProducts()
      .then((data) => setProductos(data))
      .catch(() => alert("Error al obtener productos"));

    getDolarValue()
      .then(setValorDolar)
      .catch(() => {
        console.warn("No se pudo obtener el valor del dólar");
        setValorDolar(0);
      });
  }, []);

  const handleAddItem = () => {
    setItems([...items, { idProducto: "", cantidad: 1 }]);
  };

  const handleChangeItem = (index, field, value) => {
    const nuevosItems = [...items];

    if (field === "cantidad") {
      const producto = productos.find(p => p.idProducto === Number(nuevosItems[index].idProducto));
      const cantidad = Number(value);

      if (producto && cantidad > producto.stockActual) {
        alert(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stockActual}`);
        return;
      }

      nuevosItems[index][field] = cantidad;
    } else {
      nuevosItems[index][field] = value;
    }

    setItems(nuevosItems);
  };


  const handleRemoveItem = (index) => {
    const nuevosItems = [...items];
    nuevosItems.splice(index, 1);
    setItems(nuevosItems);
  };

  const calcularTotalYGanancia = () => {
    let total = 0;
    let ganancia = 0;

    items.forEach(({ idProducto, cantidad }) => {
      const producto = productos.find(
        (p) => p.idProducto === Number(idProducto)
      );
      if (producto) {
        total += producto.precioVenta * cantidad;
        ganancia += (producto.precioVenta - producto.precioCosto) * cantidad;
      }
    });

    return { total, ganancia };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const confirmar = confirm("¿Estás seguro de guardar esta venta?");
    if (!confirmar) return;

    const venta = {
      fecha,
      cliente,
      formaPago,
      valorDolar: parseFloat(valorDolar),
      equipoPartePago,
      items: items.map(({ idProducto, cantidad }) => ({
        idProducto: Number(idProducto),
        cantidad: Number(cantidad),
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

  const { total, ganancia } = calcularTotalYGanancia();

  // 🎨 Estilos
  const container = {
    padding: 24,
    maxWidth: 700,
    margin: "0 auto",
    background: "#f9f9f9",
    borderRadius: 12,
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  };

  const formGroup = {
    marginBottom: 16,
    display: "flex",
    flexDirection: "column",
  };

  const label = {
    marginBottom: 6,
    fontWeight: "bold",
  };

  const input = {
    padding: 8,
    border: "1px solid #ccc",
    borderRadius: 6,
  };

  const select = {
    padding: 8,
    border: "1px solid #ccc",
    borderRadius: 6,
  };

  const itemRow = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  };

  const button = {
    padding: "8px 12px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
  };

  const removeBtn = {
    background: "#dc3545",
  };

  return (
    <div style={container}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Nueva Venta</h2>
      <form onSubmit={handleSubmit}>
        <div style={formGroup}>
          <label style={label}>Fecha:</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={input}
            required
          />
        </div>

        <div style={formGroup}>
          <label style={label}>Cliente:</label>
          <input
            type="text"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            style={input}
            required
          />
        </div>

        <div style={formGroup}>
          <label style={label}>Forma de Pago:</label>
          <select
            value={formaPago}
            onChange={(e) => setFormaPago(e.target.value)}
            style={select}
            required
          >
            <option value="">Seleccionar</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div style={formGroup}>
          <label style={label}>Valor del dólar:</label>
          <input
            type="number"
            step="0.01"
            value={valorDolar}
            onChange={(e) => setValorDolar(e.target.value)}
            style={input}
            required
          />
        </div>

        <div style={formGroup}>
          <label style={label}>Equipo como parte de pago:</label>
          <input
            type="text"
            value={equipoPartePago}
            onChange={(e) => setEquipoPartePago(e.target.value)}
            style={input}
          />
        </div>

        <hr style={{ margin: "24px 0" }} />

        <h3>Productos</h3>
        {items.map((item, index) => (
          <div key={index} style={itemRow}>
            <select
              value={item.idProducto}
              onChange={(e) => handleChangeItem(index, "idProducto", e.target.value)}
              required
            >
              <option value="">Seleccionar producto</option>
              {productos.map((p) => (
                <option key={p.idProducto} value={p.idProducto}>
                  {p.nombre} (Stock: {p.stockActual})
                </option>
              ))}
            </select>

            <input
              type="number"
              min={1}
              value={item.cantidad}
              onChange={(e) =>
                handleChangeItem(index, "cantidad", e.target.value)
              }
              style={input}
              required
            />
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              style={{ ...button, ...removeBtn }}
            >
              ❌
            </button>
          </div>
        ))}

        <button type="button" onClick={handleAddItem} style={button}>
          + Agregar producto
        </button>

        <div style={{ marginTop: 16 }}>
          <strong>Total:</strong> ${total.toFixed(2)} <br />
          <strong>Ganancia:</strong> ${ganancia.toFixed(2)}
        </div>

        <button type="submit" style={{ ...button, marginTop: 24 }}>
          Guardar Venta
        </button>
      </form>
    </div>
  );
}
