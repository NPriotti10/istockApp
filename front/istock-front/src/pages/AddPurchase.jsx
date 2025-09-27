// src/pages/AddPurchase.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPurchase } from "../services/purchases";

export default function AddPurchase() {
  const navigate = useNavigate();

  const [proveedor, setProveedor] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([{ nombre: "", descripcion: "", precioCosto: "", cantidad: 1 }]);
  const [guardando, setGuardando] = useState(false);

  const addRow = () => {
    setItems((prev) => [...prev, { nombre: "", descripcion: "", precioCosto: "", cantidad: 1 }]);
  };

  const removeRow = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (idx, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      if (field === "cantidad") {
        const n = Math.max(1, parseInt(value || "1", 10));
        copy[idx][field] = n;
      } else if (field === "precioCosto") {
        // permitir "10,50"
        copy[idx][field] = value.replace(",", ".");
      } else {
        copy[idx][field] = value;
      }
      return copy;
    });
  };

  const total = items.reduce((acc, it) => {
    const costo = parseFloat(it.precioCosto || "0");
    const cant = parseInt(it.cantidad || "0", 10);
    return acc + (isNaN(costo) || isNaN(cant) ? 0 : costo * cant);
  }, 0);

  const validate = () => {
    if (!proveedor.trim()) {
      alert("Ingresá el proveedor.");
      return false;
    }
    if (items.length === 0) {
      alert("Agregá al menos un ítem.");
      return false;
    }
    for (const [i, it] of items.entries()) {
      if (!it.nombre.trim()) {
        alert(`Falta el nombre en la fila ${i + 1}.`);
        return false;
      }
      const costo = parseFloat(it.precioCosto);
      if (isNaN(costo) || costo < 0) {
        alert(`Precio costo inválido en la fila ${i + 1}.`);
        return false;
      }
      const cant = parseInt(it.cantidad, 10);
      if (isNaN(cant) || cant < 1) {
        alert(`Cantidad inválida en la fila ${i + 1}.`);
        return false;
      }
    }
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      proveedor: proveedor.trim(),
      fecha,
      items: items.map((it) => ({
        nombre: it.nombre.trim(),
        descripcion: it.descripcion?.trim() || "",
        precioCosto: parseFloat(it.precioCosto || "0"),
        cantidad: parseInt(it.cantidad || "1", 10),
      })),
    };

    try {
      setGuardando(true);
      await createPurchase(payload);
      alert("✅ Compra creada correctamente");
      navigate("/compras");
    } catch (err) {
      console.error(err);
      alert("❌ Error al crear la compra");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="body-bg" style={{ padding: 24 }}>
      {/* Encabezado consistente */}
      <div className="products-header">
        <h1 className="products-title">NUEVA COMPRA</h1>
        <Link to="/compras" className="action-btn">← Volver</Link>
      </div>

      {/* Form principal (mismo contenedor visual de tus forms) */}
      <form onSubmit={onSubmit} className="form-container" style={{ maxWidth: 980 }}>
        <h2 style={{ textAlign: "center" }}>Registrar compra</h2>

        {/* Cabecera */}
        <label>
          Proveedor
          <input
            className="input"
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
            placeholder="Ej: Mayorista X"
            required
          />
        </label>

        <label>
          Fecha
          <input
            className="input"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </label>

        {/* Ítems libres */}
        <div className="products-table-container" style={{ marginTop: 12 }}>
          <table className="products-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th style={{ textAlign: "right" }}>Precio costo</th>
                <th style={{ textAlign: "right" }}>Cantidad</th>
                <th style={{ textAlign: "right" }}>Subtotal</th>
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const costo = parseFloat(it.precioCosto || "0");
                const cant = parseInt(it.cantidad || "0", 10);
                const sub = (isNaN(costo) || isNaN(cant)) ? 0 : costo * cant;

                return (
                  <tr key={idx}>
                    <td>
                      <input
                        className="input"
                        value={it.nombre}
                        onChange={(e) => updateRow(idx, "nombre", e.target.value)}
                        placeholder="Nombre producto"
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        value={it.descripcion}
                        onChange={(e) => updateRow(idx, "descripcion", e.target.value)}
                        placeholder="Descripción (opcional)"
                      />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.precioCosto}
                        onChange={(e) => updateRow(idx, "precioCosto", e.target.value)}
                        placeholder="0.00"
                        style={{ textAlign: "right" }}
                      />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        value={it.cantidad}
                        onChange={(e) => updateRow(idx, "cantidad", e.target.value)}
                        style={{ textAlign: "right" }}
                      />
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>${sub.toFixed(2)}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="action-btn delete"
                        onClick={() => removeRow(idx)}
                        disabled={items.length === 1}
                        title={items.length === 1 ? "Debe quedar al menos una fila" : "Eliminar fila"}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr>
                <td colSpan={6} style={{ paddingTop: 10 }}>
                  <button type="button" className="action-btn" onClick={addRow}>
                    + Agregar fila
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Total + acciones */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 700 }}>
            Total: <span style={{ color: "#2563eb" }}>${total.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link to="/compras" className="action-btn">Cancelar</Link>
            <button type="submit" className="add-product-btn" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar compra"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
