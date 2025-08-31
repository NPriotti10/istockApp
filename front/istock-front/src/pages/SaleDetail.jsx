// src/pages/SaleDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSaleById } from "../services/sales";
import { moneyUSD, moneyARS } from "../utils/format";

export default function SaleDetail() {
  const { id } = useParams();
  const [venta, setVenta] = useState(null);

  useEffect(() => {
    getSaleById(id)
      .then(setVenta)
      .catch((err) => {
        console.error("Error al obtener la venta:", err);
        alert("Error al cargar el detalle de la venta");
      });
  }, [id]);

  if (!venta) return <p style={{ padding: 32 }}>Cargando venta...</p>;

  const {
    cliente,
    fecha,
    formaPago,
    productos,          // array de items
    valorDolar,
    equipoPartePago,
    precioTotal,        // total USD de la venta
    gananciaTotal       // total USD de la venta
  } = venta;

  const usdToArs = (nUsd) => Number(nUsd ?? 0) * Number(valorDolar ?? 1);

  const fmtDateTime = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d)) return "-";
    return d.toLocaleString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>🧾 Detalle de venta</h2>
            <p style={styles.subtitle}>Resumen de la operación y sus productos</p>
          </div>
          <Link to="/ventas" style={styles.backButton}>← Volver a ventas</Link>
        </div>

        {/* Datos de la venta */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <span style={styles.label}>Cliente</span>
              <span style={styles.value}>{cliente || "-"}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.label}>Fecha</span>
              <span style={styles.value}>{fmtDateTime(fecha)}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.label}>Forma de pago</span>
              <span style={styles.value}>{formaPago || "-"}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.label}>Valor del dólar</span>
              <span style={styles.value}>{moneyARS(valorDolar)}</span>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={styles.label}>Equipo tomado como parte de pago</span>
              <div style={styles.badgeLine}>
                <span style={styles.badge}>{equipoPartePago || "Ninguno"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de productos */}
        <h3 style={styles.sectionTitle}>PRODUCTOS</h3>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Producto</th>
                <th style={styles.th}>Categoría</th>
                <th style={styles.th}>Cantidad</th>
                <th style={styles.th}>Total USD</th>
                <th style={styles.th}>Total ARS</th>
                <th style={styles.th}>Ganancia USD</th>
                <th style={styles.th}>Ganancia ARS</th>
                <th style={styles.th}>N° Serie</th>
              </tr>
            </thead>
            <tbody>
              {productos?.map((item, idx) => {
                // Snapshots + fallbacks
                const nombre =
                  item?.nombreProducto ??
                  item?.producto?.nombre ??
                  "(producto eliminado)";

                const categoria =
                  item?.categoriaNombre ??
                  item?.producto?.categoria?.nombre ??
                  "-";

                // Montos por línea (en USD desde backend)
                const lineUsd =
                  Number(item?.precioTotal ??
                    (Number(item?.precioUnitario ?? 0) * Number(item?.cantidad ?? 0)));
                const lineArs = usdToArs(lineUsd);
                const gainUsd = Number(item?.ganancia ?? 0);
                const gainArs = usdToArs(gainUsd);

                return (
                  <tr key={item?.idItemVenta ?? idx} style={styles.tr}>
                    <td style={styles.td}>{nombre}</td>
                    <td style={styles.td}>
                      <span style={styles.catPill}>{categoria}</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      {item?.cantidad ?? 0}
                    </td>
                    <td style={styles.tdRight}>{moneyUSD(lineUsd)}</td>
                    <td style={styles.tdRight}>{moneyARS(lineArs)}</td>
                    <td style={styles.tdRight}>{moneyUSD(gainUsd)}</td>
                    <td style={styles.tdRight}>{moneyARS(gainArs)}</td>
                    <td style={styles.td}>{item?.numeroSerie || <span style={styles.muted}>-</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div style={styles.totalsCard}>
          <div style={styles.totalsGrid}>
            <div style={styles.totalBox}>
              <span style={styles.totalLabel}>Precio total (USD)</span>
              <span style={styles.totalValue}>{moneyUSD(precioTotal)}</span>
            </div>
            <div style={styles.totalBox}>
              <span style={styles.totalLabel}>Precio total (ARS)</span>
              <span style={styles.totalValue}>{moneyARS(usdToArs(precioTotal))}</span>
            </div>
            <div style={styles.totalBoxSuccess}>
              <span style={styles.totalLabel}>Ganancia total (USD)</span>
              <span style={styles.totalValue}>{moneyUSD(gananciaTotal)}</span>
            </div>
            <div style={styles.totalBoxSuccess}>
              <span style={styles.totalLabel}>Ganancia total (ARS)</span>
              <span style={styles.totalValue}>{moneyARS(usdToArs(gananciaTotal))}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <Link to="/ventas" style={styles.linkBack}>← Volver a ventas</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#f6f8fb",
    padding: "24px",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial",
    color: "#0f172a",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  title: { fontSize: 28, fontWeight: 800, margin: 0 },
  subtitle: { color: "#64748b", margin: "4px 0 0", fontSize: 14 },
  backButton: {
    fontWeight: 700,
    border: "1px solid #d1d5db",
    padding: "8px 12px",
    borderRadius: 10,
    background: "#fff",
    textDecoration: "none",
    color: "#111827",
  },

  summaryCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    boxShadow: "0 6px 20px rgba(16,24,40,.06)",
    padding: 16,
    marginTop: 8,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: 12,
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: { fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em" },
  value: { fontSize: 16, fontWeight: 700 },
  badgeLine: { marginTop: 6 },
  badge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#eef2ff",
    color: "#3730a3",
    border: "1px solid #c7d2fe",
    fontWeight: 600,
    fontSize: 13,
  },

  sectionTitle: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: 800,
    color: "#1f2937",
  },

  tableWrap: {
    overflowX: "auto",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 14px rgba(16,24,40,.05)",
    background: "#fff",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 760,
  },
  th: {
    position: "sticky",
    top: 0,
    background: "#f3f6fb",
    color: "#334155",
    textAlign: "left",
    fontSize: 13,
    padding: "12px 14px",
    borderBottom: "1px solid #e5e7eb",
  },
  tr: {
    transition: "background-color .16s ease",
  },
  td: {
    padding: "12px 14px",
    borderBottom: "1px solid #eef2f7",
    fontSize: 14,
    color: "#475569",
  },
  tdRight: {
    padding: "12px 14px",
    borderBottom: "1px solid #eef2f7",
    fontSize: 14,
    color: "#111827",
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
  },
  catPill: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    background: "#ecfeff",
    border: "1px solid #bae6fd",
    color: "#075985",
    fontSize: 12,
    fontWeight: 700,
  },
  muted: { color: "#94a3b8", fontStyle: "italic" },

  totalsCard: {
    marginTop: 16,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 16,
  },
  totalsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: 12,
  },
  totalBox: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
  },
  totalBoxSuccess: {
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    borderRadius: 12,
    padding: 12,
  },
  totalLabel: { fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em" },
  totalValue: { marginTop: 6, fontSize: 20, fontWeight: 800, color: "#0f172a" },

  linkBack: {
    marginTop: 8,
    fontWeight: 700,
    color: "#2563eb",
    textDecoration: "none",
  },
};
