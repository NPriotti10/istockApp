// src/pages/PurchaseDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPurchaseById } from "../services/purchases";
import { moneyUSD } from "../utils/format";

export default function PurchaseDetail() {
  const { id } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPurchaseById(id)
      .then((data) => setPurchase(data))
      .catch((err) => {
        console.error("Error al obtener la compra:", err);
        alert("Error al cargar el detalle de la compra");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Normalizo ítems para soportar:
  //   - items: string[] (TU CASO ACTUAL)
  //   - items: { nombre, descripcion, precioCosto|precioUnitario, cantidad }[]
  //   - productos: { ... }[] (legado)
  const normalized = useMemo(() => {
    if (!purchase) return { kind: "none", rows: [] };

    // items: string[]
    if (Array.isArray(purchase.items) && (purchase.items[0] == null || typeof purchase.items[0] === "string")) {
      const rows = (purchase.items || []).map((s) => String(s ?? ""));
      return { kind: "strings", rows };
    }

    // items: objetos
    if (Array.isArray(purchase.items) && typeof purchase.items[0] === "object") {
      const rows = purchase.items.map((it) => ({
        nombre: it.nombre ?? "",
        descripcion: it.descripcion ?? "",
        // algunos back usan precioCosto, otros precioUnitario
        precio: Number(it.precioCosto ?? it.precioUnitario ?? 0) || 0,
        cantidad: Number(it.cantidad ?? 1) || 0,
      }));
      return { kind: "objects", rows };
    }

    // productos: objetos (legado)
    if (Array.isArray(purchase.productos)) {
      const rows = purchase.productos.map((p) => ({
        nombre: p.nombreProducto ?? p.nombre ?? "",
        descripcion: p.descripcion ?? "",
        precio: Number(p.precioUnitario ?? p.precioCosto ?? 0) || 0,
        cantidad: Number(p.cantidad ?? 1) || 0,
      }));
      return { kind: "objects", rows };
    }

    return { kind: "none", rows: [] };
  }, [purchase]);

  // Total mostrado: si viene del back lo usamos; si no, lo calculamos
  const totalCalculado = useMemo(() => {
    if (normalized.kind !== "objects") return 0;
    return normalized.rows.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  }, [normalized]);

  if (loading) return <p style={{ padding: 32 }}>Cargando compra...</p>;
  if (!purchase) return <p style={{ padding: 32 }}>No se encontró la compra.</p>;

  const proveedor = purchase.proveedor ?? purchase.Proveedor ?? "-";
  const fecha = purchase.fecha ?? purchase.Fecha ?? null;

  const hasTotalNumber = typeof purchase.precioTotal === "number";
  const totalMostrar = hasTotalNumber ? Number(purchase.precioTotal) : totalCalculado;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🧾 Detalle de compra</h2>

      {/* Cabecera */}
      <div style={styles.section}>
        <div style={styles.row}>
          <span style={styles.label}>Proveedor:</span>
          <span style={styles.value}>{proveedor}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Fecha:</span>
          <span style={styles.value}>
            {fecha ? new Date(fecha).toLocaleString("es-AR") : "-"}
          </span>
        </div>
      </div>

      {/* Ítems */}
      <h3 style={styles.subtitle}> Lista de Productos:</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            {normalized.kind === "strings" ? (
              <tr style={styles.headerRow}>
                <th style={styles.cell}>Detalle</th>
              </tr>
            ) : normalized.kind === "objects" ? (
              <tr style={styles.headerRow}>
                <th style={styles.cell}>Producto</th>
                <th style={styles.cell}>Descripción</th>
                <th style={styles.cellNum}>Cantidad</th>
                <th style={styles.cellNum}>Precio USD</th>
                <th style={styles.cellNum}>Subtotal USD</th>
              </tr>
            ) : (
              <tr style={styles.headerRow}>
                <th style={styles.cell}>Detalle</th>
              </tr>
            )}
          </thead>
          <tbody>
            {normalized.rows.length === 0 ? (
              <tr>
                <td style={styles.cell} colSpan={5}>Sin ítems en esta compra.</td>
              </tr>
            ) : normalized.kind === "strings" ? (
              normalized.rows.map((linea, idx) => {
                const zebra = idx % 2 === 0 ? "#f8fafc" : "white";
                return (
                  <tr
                    key={idx}
                    style={{ backgroundColor: zebra, transition: "background-color .2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e0f2fe")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = zebra)}
                  >
                    <td style={styles.cell}>{linea}</td>
                  </tr>
                );
              })
            ) : (
              normalized.rows.map((it, idx) => {
                const subtotal = it.precio * it.cantidad;
                const zebra = idx % 2 === 0 ? "#f8fafc" : "white";
                return (
                  <tr
                    key={`${it.nombre}-${idx}`}
                    style={{ backgroundColor: zebra, transition: "background-color .2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e0f2fe")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = zebra)}
                  >
                    <td style={styles.cell}>{it.nombre}</td>
                    <td style={styles.cell}>{it.descripcion}</td>
                    <td style={styles.cellNum}>{it.cantidad}</td>
                    <td style={styles.cellNum}>{moneyUSD(it.precio)}</td>
                    <td style={styles.cellNum}><strong>{moneyUSD(subtotal)}</strong></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div style={styles.sectionTotal}>
        <p style={styles.total}>
          <strong>💵 TOTAL COMPRA:</strong> {moneyUSD(totalMostrar)} USD
        </p>
        {!hasTotalNumber && (
          <p style={{ margin: 0, color: "#64748b" }}>(Calculado en frontend)</p>
        )}
      </div>

      <Link
        to="/compras"
        style={styles.backLink}
        onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
        onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
      >
        ← Volver a compras
      </Link>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1000px",
    margin: "auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: "#0f172a",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#1e293b",
    letterSpacing: .2,
  },
  subtitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#334155",
    marginTop: 4,
  },
  section: {
    backgroundColor: "#f1f5f9",
    padding: "16px",
    borderRadius: "12px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    border: "1px solid #e2e8f0",
  },
  row: { display: "flex", gap: 10, alignItems: "center" },
  label: { minWidth: 140, color: "#475569", fontWeight: 700, fontSize: 14 },
  value: { fontWeight: 600, color: "#0f172a" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "15px",
    minWidth: "700px",
  },
  headerRow: { backgroundColor: "#f8fafc" },
  cell: {
    padding: "10px",
    textAlign: "left",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "middle",
  },
  cellNum: {
    padding: "10px",
    textAlign: "right",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },
  sectionTotal: {
    backgroundColor: "#e0f7fa",
    padding: "16px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    border: "1px solid #bae6fd",
  },
  total: { fontSize: "17px", fontWeight: "bold", color: "#0f172a" },
  backLink: {
    marginTop: "8px",
    fontWeight: "bold",
    color: "#2563eb",
    textDecoration: "none",
    alignSelf: "flex-start",
  },
};
