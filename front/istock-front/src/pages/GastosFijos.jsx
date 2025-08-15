// src/pages/GastosFijos.jsx
import { useEffect, useMemo, useState } from "react";
import {
  getGastosFijos,
  addGastoFijo,
  deleteGastoFijo,
  // updateGastoFijo, // por si después agregás edición
} from "../services/gastosFijos";

export default function GastosFijos() {
  const [gastos, setGastos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await getGastosFijos(); // ✅ usa el servicio con axios + Bearer
      setGastos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("❌ Error al obtener gastos:", e);
      setErr("Error al obtener gastos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErr("");

    const nombreOk = nombre.trim();
    const montoNum = Number(monto);

    if (!nombreOk || Number.isNaN(montoNum)) {
      setErr("Nombre y monto son obligatorios.");
      return;
    }

    try {
      await addGastoFijo({ nombre: nombreOk, monto: montoNum });
      setNombre("");
      setMonto("");
      await load();
    } catch (e) {
      console.error("❌ Error al agregar gasto:", e);
      setErr("Error al agregar gasto");
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este gasto fijo?")) return;
    try {
      await deleteGastoFijo(id);
      await load();
    } catch (e) {
      console.error("❌ Error al eliminar gasto:", e);
      setErr("Error al eliminar gasto");
    }
  };

  const total = useMemo(
    () => gastos.reduce((acc, g) => acc + Number(g.monto ?? 0), 0),
    [gastos]
  );

  const currency = (n) =>
    Number.isFinite(n) ? `$${n.toFixed(2)}` : "$0.00";

  const styles = {
    container: { display: "flex", justifyContent: "center", padding: "2rem" },
    box: {
      backgroundColor: "#f9f9f9",
      padding: "2rem",
      borderRadius: "12px",
      maxWidth: "600px",
      width: "100%",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    },
    title: { textAlign: "center", fontSize: "1.8rem", marginBottom: "1.5rem", color: "#333" },
    subtitle: { fontSize: "1.2rem", color: "#666" },
    form: { display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" },
    formGroup: { display: "flex", flexDirection: "column" },
    label: { fontWeight: 600, marginBottom: 4 },
    input: { padding: 8, border: "1px solid #ccc", borderRadius: 6, fontSize: "1rem" },
    button: {
      alignSelf: "flex-start",
      backgroundColor: "#007bff",
      color: "#fff",
      padding: "0.5rem 1.2rem",
      border: "none",
      borderRadius: 6,
      cursor: "pointer",
      fontWeight: "bold",
    },
    list: { listStyle: "none", padding: 0, margin: 0 },
    item: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.6rem 0",
      borderBottom: "1px solid #ddd",
    },
    texto: { fontSize: "1rem", color: "#333" },
    monto: { fontWeight: "bold", color: "#28a745" },
    eliminar: { background: "none", border: "none", color: "#dc3545", cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem" },
    total: { marginTop: "1.5rem", textAlign: "right", fontSize: "1.1rem", fontWeight: "bold", color: "#333" },
    totalMonto: { color: "#007bff" },
    sinGastos: { textAlign: "center", color: "#666", fontStyle: "italic" },
    error: { color: "#dc3545", marginBottom: 10, fontWeight: 600 },
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.title}>
          💸 Gastos Fijos <span style={styles.subtitle}>(USD)</span>
        </h2>

        {err && <div style={styles.error}>{err}</div>}

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre</label>
            <input
              style={styles.input}
              value={nombre}
              placeholder="Ej: Alquiler"
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Monto ($)</label>
            <input
              style={styles.input}
              value={monto}
              placeholder="Ej: 100"
              type="number"
              step="0.01"
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Guardando..." : "➕ Agregar"}
          </button>
        </form>

        {loading ? (
          <p style={styles.sinGastos}>Cargando…</p>
        ) : gastos.length === 0 ? (
          <p style={styles.sinGastos}>No hay gastos fijos registrados.</p>
        ) : (
          <>
            <ul style={styles.list}>
              {gastos.map((g) => {
                const id = g.id ?? g.idGastoFijo ?? g.Id ?? g.IdGastoFijo; // soporta varias keys
                const montoN = Number(g.monto ?? g.Monto ?? 0);
                return (
                  <li key={id} style={styles.item}>
                    <span style={styles.texto}>
                      {g.nombre ?? g.Nombre}:{" "}
                      <span style={styles.monto}>{currency(montoN)}</span>
                    </span>
                    <button
                      style={styles.eliminar}
                      onClick={() => handleEliminar(id)}
                      title="Eliminar"
                    >
                      🗑️ Eliminar
                    </button>
                  </li>
                );
              })}
            </ul>

            <div style={styles.total}>
              Total mensual: <span style={styles.totalMonto}>{currency(total)} USD</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
