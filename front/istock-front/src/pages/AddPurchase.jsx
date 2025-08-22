import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPurchase } from "../services/purchases";

export default function AddPurchase() {
  const navigate = useNavigate();

  const [proveedor, setProveedor] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([
    { nombre: "", descripcion: "", precioCosto: "", cantidad: 1 },
  ]);
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
      await createPurchase(payload); // POST /api/compra
      alert("✅ Compra creada correctamente");
      navigate("/compras");
    } catch (err) {
      console.error(err);
      alert("❌ Error al crear la compra");
    } finally {
      setGuardando(false);
    }
  };

  const S = styles;

  return (
    <div style={S.page}>
      <div style={S.card}>
        <h2 style={S.title}>Nueva compra</h2>

        <form onSubmit={onSubmit}>
          {/* Cabecera */}
          <div style={S.row}>
            <div style={S.col}>
              <label style={S.label}>Proveedor</label>
              <input
                style={S.input}
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Ej: Mayorista X"
                required
              />
            </div>
            <div style={S.col}>
              <label style={S.label}>Fecha</label>
              <input
                style={S.input}
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>

          {/* Ítems libres */}
          <div style={{ ...S.tableWrap, marginTop: 16 }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Nombre</th>
                  <th style={S.th}>Descripción</th>
                  <th style={S.thNum}>Precio costo</th>
                  <th style={S.thNum}>Cantidad</th>
                  <th style={S.thNum}>Subtotal</th>
                  <th style={S.th}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const costo = parseFloat(it.precioCosto || "0");
                  const cant = parseInt(it.cantidad || "0", 10);
                  const sub = (isNaN(costo) || isNaN(cant)) ? 0 : costo * cant;

                  return (
                    <tr key={idx}>
                      <td style={S.td}>
                        <input
                          style={S.input}
                          value={it.nombre}
                          onChange={(e) => updateRow(idx, "nombre", e.target.value)}
                          placeholder="Nombre producto"
                        />
                      </td>
                      <td style={S.td}>
                        <input
                          style={S.input}
                          value={it.descripcion}
                          onChange={(e) => updateRow(idx, "descripcion", e.target.value)}
                          placeholder="Descripción (opcional)"
                        />
                      </td>
                      <td style={S.tdNum}>
                        <input
                          style={S.input}
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.precioCosto}
                          onChange={(e) => updateRow(idx, "precioCosto", e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td style={S.tdNum}>
                        <input
                          style={S.input}
                          type="number"
                          min="1"
                          value={it.cantidad}
                          onChange={(e) => updateRow(idx, "cantidad", e.target.value)}
                        />
                      </td>
                      <td style={S.tdNum}><strong>${sub.toFixed(2)}</strong></td>
                      <td style={S.tdCenter}>
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          style={S.btnDanger}
                          disabled={items.length === 1}
                          title={items.length === 1 ? "Debe quedar al menos una fila" : "Eliminar fila"}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} style={{ paddingTop: 12 }}>
                    <button type="button" onClick={addRow} style={S.btnGhost}>+ Agregar fila</button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Total + acciones */}
          <div style={S.footer}>
            <div style={S.total}>
              Total: <span style={S.totalNum}>${total.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => navigate("/compras")} style={S.btnGhost}>
                Cancelar
              </button>
              <button type="submit" disabled={guardando} style={S.btnPrimary}>
                {guardando ? "Guardando..." : "Guardar compra"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* === estilos inline === */
const styles = {
  page: { padding: 24 },
  card: {
    maxWidth: 980, margin: "0 auto", background: "#fff",
    border: "1px solid #e5e7eb", borderRadius: 12, padding: 16,
    boxShadow: "0 6px 20px rgba(0,0,0,.06)"
  },
  title: { margin: 0, fontSize: 22, fontWeight: 800 },
  row: { display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, marginTop: 16 },
  col: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: {
    padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14,
    outline: "none",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  th: {
    textAlign: "left", padding: "10px 12px", fontSize: 13, color: "#475569",
    borderBottom: "1px solid #e5e7eb", background: "#f8fafc"
  },
  thNum: {
    textAlign: "right", padding: "10px 12px", fontSize: 13, color: "#475569",
    borderBottom: "1px solid #e5e7eb", background: "#f8fafc"
  },
  td: { padding: "10px 12px", borderBottom: "1px solid #eef2f7" },
  tdNum: { padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #eef2f7" },
  tdCenter: { padding: "10px 12px", textAlign: "center", borderBottom: "1px solid #eef2f7" },
  footer: {
    marginTop: 16, display: "flex", justifyContent: "space-between",
    alignItems: "center", gap: 12, flexWrap: "wrap"
  },
  total: { fontSize: 16, fontWeight: 700 },
  totalNum: { color: "#1d4ed8" },
  btnPrimary: {
    background: "#2563eb", color: "#fff", border: "none", padding: "10px 14px",
    borderRadius: 8, fontWeight: 700, cursor: "pointer"
  },
  btnGhost: {
    background: "#eef2ff", color: "#1e293b", border: "1px solid #c7d2fe",
    padding: "10px 14px", borderRadius: 8, fontWeight: 600, cursor: "pointer"
  },
  btnDanger: {
    background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca",
    padding: "6px 10px", borderRadius: 8, fontWeight: 700, cursor: "pointer"
  }
};
