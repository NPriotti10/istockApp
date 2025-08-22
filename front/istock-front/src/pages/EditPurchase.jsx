import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPurchaseById, updatePurchase } from "../services/purchases";

export default function EditPurchase() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    proveedor: "",
    fecha: new Date().toISOString().split("T")[0], // yyyy-mm-dd
  });
  const [items, setItems] = useState([]); // [{nombre, descripcion, precioCosto, cantidad}]

  // Cargar compra y normalizar a items libres
  useEffect(() => {
    setLoading(true);
    getPurchaseById(id)
      .then((data) => {
        const fecha = data?.fecha ? new Date(data.fecha).toISOString().split("T")[0] : form.fecha;
        const proveedor = data?.proveedor || "";

        let normalized = [];
        if (Array.isArray(data?.items)) {
          normalized = data.items.map((it) => ({
            nombre: it.nombre ?? "",
            descripcion: it.descripcion ?? "",
            precioCosto: Number(it.precioCosto ?? 0),
            cantidad: Number(it.cantidad ?? 1),
          }));
        } else if (Array.isArray(data?.productos)) {
          // compatibilidad con formato viejo
          normalized = data.productos.map((p) => ({
            nombre: p.nombreProducto ?? p.nombre ?? "",
            descripcion: p.descripcion ?? "",
            precioCosto: Number(p.precioUnitario ?? p.precioCosto ?? 0),
            cantidad: Number(p.cantidad ?? 1),
          }));
        }

        setForm({ proveedor, fecha });
        setItems(normalized);
      })
      .catch((err) => {
        console.error("Error al obtener compra:", err);
        alert("No se pudo cargar la compra");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const money = (n) => `$${Number(n || 0).toFixed(2)}`;

  const total = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.precioCosto) || 0) * (Number(it.cantidad) || 0), 0),
    [items]
  );

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (idx, field, value) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        if (field === "precioCosto") return { ...it, precioCosto: Number(value) || 0 };
        if (field === "cantidad") return { ...it, cantidad: Math.max(1, Number(value) || 1) };
        return { ...it, [field]: value };
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { nombre: "", descripcion: "", precioCosto: 0, cantidad: 1 },
    ]);
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.proveedor.trim()) {
      alert("Ingresá el proveedor.");
      return;
    }
    if (!form.fecha) {
      alert("Ingresá la fecha.");
      return;
    }
    if (items.length === 0) {
      alert("Agregá al menos un ítem.");
      return;
    }
    const itemsLimpios = items.map((it) => ({
      nombre: String(it.nombre || "").trim(),
      descripcion: String(it.descripcion || "").trim(),
      precioCosto: Number(it.precioCosto) || 0,
      cantidad: Number(it.cantidad) || 1,
    }));
    if (itemsLimpios.some((i) => !i.nombre)) {
      alert("Cada ítem debe tener nombre.");
      return;
    }

    if (!confirm("¿Guardar los cambios de esta compra?")) return;

    const payload = {
      proveedor: form.proveedor.trim(),
      fecha: new Date(form.fecha).toISOString(), // backend DateTime
      items: itemsLimpios,
    };

    try {
      await updatePurchase(id, payload);
      alert("✅ Compra actualizada correctamente");
      navigate("/compras");
    } catch (error) {
      console.error("Error al actualizar compra:", error);
      alert("❌ Error al actualizar compra");
    }
  };

  if (loading) return <p style={{ padding: 24 }}>Cargando compra...</p>;

  // ===== Styles =====
  const container = {
    padding: "24px",
    maxWidth: "900px",
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  };
  const formRow = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  };
  const formGroup = { display: "flex", flexDirection: "column" };
  const label = {
    fontWeight: "600",
    marginBottom: "6px",
    fontSize: "14px",
    color: "#374151",
  };
  const input = {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "16px",
    outline: "none",
  };
  const button = {
    padding: "12px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  };
  const addBtn = { ...button, background: "#0ea5e9" };
  const removeBtn = { ...button, background: "#ef4444" };

  const tableWrap = { overflowX: "auto" };
  const table = {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "760px",
  };
  const th = {
    textAlign: "left",
    padding: "10px",
    background: "#f1f5f9",
    borderBottom: "1px solid #e2e8f0",
    fontSize: 14,
    color: "#334155",
  };
  const td = {
    padding: "8px",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "middle",
  };
  const tdNum = { ...td, textAlign: "right", whiteSpace: "nowrap" };

  return (
    <div style={container}>
      <h2 style={{ textAlign: "center", marginBottom: 8 }}>Editar Compra</h2>

      <form onSubmit={handleSubmit}>
        <div style={formRow}>
          <div style={formGroup}>
            <label style={label}>Proveedor</label>
            <input
              type="text"
              name="proveedor"
              value={form.proveedor}
              onChange={handleFormChange}
              style={input}
              required
            />
          </div>
          <div style={formGroup}>
            <label style={label}>Fecha</label>
            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleFormChange}
              style={input}
              required
            />
          </div>
        </div>

        <h3 style={{ marginTop: 16 }}>Ítems</h3>
        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Nombre</th>
                <th style={th}>Descripción</th>
                <th style={{ ...th, textAlign: "right" }}>Precio USD</th>
                <th style={{ ...th, textAlign: "right" }}>Cantidad</th>
                <th style={{ ...th, textAlign: "right" }}>Subtotal</th>
                <th style={{ ...th, textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td style={td} colSpan={6}>
                    No hay ítems. Agregá al menos uno.
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => {
                  const subtotal = (Number(it.precioCosto) || 0) * (Number(it.cantidad) || 0);
                  return (
                    <tr key={idx}>
                      <td style={td}>
                        <input
                          type="text"
                          value={it.nombre}
                          onChange={(e) => handleItemChange(idx, "nombre", e.target.value)}
                          style={{ ...input, width: "100%" }}
                          placeholder="Nombre del producto"
                        />
                      </td>
                      <td style={td}>
                        <input
                          type="text"
                          value={it.descripcion}
                          onChange={(e) => handleItemChange(idx, "descripcion", e.target.value)}
                          style={{ ...input, width: "100%" }}
                          placeholder="Descripción"
                        />
                      </td>
                      <td style={tdNum}>
                        <input
                          type="number"
                          step="0.01"
                          value={it.precioCosto}
                          onChange={(e) => handleItemChange(idx, "precioCosto", e.target.value)}
                          style={{ ...input, width: 120, textAlign: "right" }}
                        />
                      </td>
                      <td style={tdNum}>
                        <input
                          type="number"
                          min={1}
                          value={it.cantidad}
                          onChange={(e) => handleItemChange(idx, "cantidad", e.target.value)}
                          style={{ ...input, width: 100, textAlign: "right" }}
                        />
                      </td>
                      <td style={tdNum}>
                        <strong>{money(subtotal)}</strong>
                      </td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          style={{ ...removeBtn, padding: "8px 10px" }}
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, textAlign: "right", fontWeight: 700 }}>
          Total: {money(total)}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button type="button" onClick={addItem} style={addBtn}>
            + Agregar ítem
          </button>
          <button type="submit" style={button}>
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
