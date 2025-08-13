import { useEffect, useState } from "react";

export default function GastosFijos() {
  const [gastos, setGastos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");

  const fetchGastos = async () => {
    try {
      const res = await fetch("/api/GastosFijos");
      if (!res.ok) throw new Error("Error al obtener gastos");
      const data = await res.json();
      setGastos(data);
    } catch (err) {
      console.error("❌ Error al traer gastos:", err.message);
    }
  };

  const handleAgregar = async () => {
    if (!nombre || !monto) return alert("Nombre y monto son obligatorios.");

    const nuevoGasto = {
      nombre,
      monto: parseFloat(monto),
    };

    try {
      const res = await fetch("/api/GastosFijos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoGasto),
      });
      if (!res.ok) throw new Error("Error al agregar gasto");

      setNombre("");
      setMonto("");
      fetchGastos();
    } catch (err) {
      console.error("❌ Error al agregar gasto:", err.message);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este gasto fijo?")) return;

    try {
      const res = await fetch(`/api/GastosFijos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar gasto");
      fetchGastos();
    } catch (err) {
      console.error("❌ Error al eliminar gasto:", err.message);
    }
  };

  useEffect(() => {
    fetchGastos();
  }, []);

  const total = gastos.reduce((acc, g) => acc + g.monto, 0);

  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      padding: "2rem",
    },
    box: {
      backgroundColor: "#f9f9f9",
      padding: "2rem",
      borderRadius: "12px",
      maxWidth: "600px",
      width: "100%",
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    },
    title: {
      textAlign: "center",
      fontSize: "1.8rem",
      marginBottom: "1.5rem",
      color: "#333",
    },
    subtitle: {
      fontSize: "1.2rem",
      color: "#666",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      marginBottom: "1.5rem",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
    },
    label: {
      fontWeight: "600",
      marginBottom: "4px",
    },
    input: {
      padding: "8px",
      border: "1px solid #ccc",
      borderRadius: "6px",
      fontSize: "1rem",
    },
    button: {
      alignSelf: "flex-start",
      backgroundColor: "#007bff",
      color: "white",
      padding: "0.5rem 1.2rem",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "bold",
    },
    list: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },
    item: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.6rem 0",
      borderBottom: "1px solid #ddd",
    },
    texto: {
      fontSize: "1rem",
      color: "#333",
    },
    monto: {
      fontWeight: "bold",
      color: "#28a745",
    },
    eliminar: {
      background: "none",
      border: "none",
      color: "#dc3545",
      cursor: "pointer",
      fontWeight: "bold",
      fontSize: "0.9rem",
    },
    total: {
      marginTop: "1.5rem",
      textAlign: "right",
      fontSize: "1.1rem",
      fontWeight: "bold",
      color: "#333",
    },
    totalMonto: {
      color: "#007bff",
    },
    sinGastos: {
      textAlign: "center",
      color: "#666",
      fontStyle: "italic",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.title}>💸 Gastos Fijos <span style={styles.subtitle}>(USD)</span></h2>

        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre</label>
            <input
              style={styles.input}
              value={nombre}
              placeholder="Ej: Alquiler"
              onChange={(e) => setNombre(e.target.value)}
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
          <button style={styles.button} onClick={handleAgregar}>➕ Agregar</button>
        </div>

        {gastos.length === 0 ? (
          <p style={styles.sinGastos}>No hay gastos fijos registrados.</p>
        ) : (
          <>
            <ul style={styles.list}>
              {gastos.map((g) => (
                <li key={g.id} style={styles.item}>
                  <span style={styles.texto}>
                    {g.nombre}: <span style={styles.monto}>${g.monto.toFixed(2)}</span>
                  </span>
                  <button style={styles.eliminar} onClick={() => handleEliminar(g.id)}>🗑️ Eliminar</button>
                </li>
              ))}
            </ul>
            <div style={styles.total}>Total mensual: <span style={styles.totalMonto}>${total.toFixed(2)} USD</span></div>
          </>
        )}
      </div>
    </div>
  );
}
