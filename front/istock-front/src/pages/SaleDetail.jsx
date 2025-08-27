import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSaleById } from "../services/sales";

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

  const fmt = (n) => Number(n ?? 0).toFixed(2);
  const usdToArs = (nUsd) => Number(nUsd ?? 0) * Number(valorDolar ?? 1);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🧾 Detalle de venta</h2>

      <div style={styles.section}>
        <div style={styles.dataRow}><strong>Cliente:</strong> {cliente}</div>
        <div style={styles.dataRow}><strong>Fecha:</strong> {new Date(fecha).toLocaleDateString()}</div>
        {formaPago && <div style={styles.dataRow}><strong>Forma de pago:</strong> {formaPago}</div>}
        <div style={styles.dataRow}><strong>Valor del dólar:</strong> ${fmt(valorDolar)} ARS</div>
        <div style={styles.dataRow}><strong>Equipo tomado como parte de pago:</strong> {equipoPartePago || "Ninguno"}</div>
      </div>

      <h3 style={styles.subtitle}>📦 LISTADO DE PRODUCTOS</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.cell}>Producto</th>
              <th style={styles.cell}>Cantidad</th>
              <th style={styles.cell}>Total USD</th>
              <th style={styles.cell}>Total ARS</th>
              <th style={styles.cell}>Ganancia USD</th>
              <th style={styles.cell}>Ganancia ARS</th>
              <th style={styles.cell}>Num Serie</th>
            </tr>
          </thead>
          <tbody>
            {productos?.map((item, idx) => {
              // Nombre del producto: usar snapshot y sólo caer a producto?.nombre si existiera
              const nombre =
                item.nombreProducto ??
                item.producto?.nombre ??
                "(producto eliminado)";

              // Totales y ganancias por línea: ya vienen en USD desde el backend
              const lineUsd = Number(item.precioTotal ?? (item.precioUnitario ?? 0) * (item.cantidad ?? 0));
              const lineArs = usdToArs(lineUsd);
              const gainUsd = Number(item.ganancia ?? 0);
              const gainArs = usdToArs(gainUsd);

              return (
                <tr
                  key={item.idItemVenta ?? idx}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "#f8fafc" : "white",
                    transition: "background-color 0.2s ease-in-out",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e0f2fe")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      idx % 2 === 0 ? "#f8fafc" : "white")
                  }
                >
                  <td style={styles.cell}>{nombre}</td>
                  <td style={styles.cell}>{item.cantidad}</td>
                  <td style={styles.cell}>${fmt(lineUsd)}</td>
                  <td style={styles.cell}>${fmt(lineArs)}</td>
                  <td style={styles.cell}>${fmt(gainUsd)}</td>
                  <td style={styles.cell}>${fmt(gainArs)}</td>
                  <td style={styles.cell}>{item.numeroSerie || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={styles.sectionTotal}>
        <p style={styles.total}><strong>💵 PRECIO TOTAL:</strong> ${fmt(precioTotal)} USD</p>
        <p style={styles.total}><strong>💵 PRECIO TOTAL:</strong> ${fmt(usdToArs(precioTotal))} ARS</p>
        <p style={styles.total}><strong>📈 GANANCIA TOTAL:</strong> ${fmt(gananciaTotal)} USD</p>
        <p style={styles.total}><strong>📈 GANANCIA TOTAL:</strong> ${fmt(usdToArs(gananciaTotal))} ARS</p>
      </div>

      <Link
        to="/ventas"
        style={styles.backLink}
        onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
        onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
      >
        ← Volver a ventas
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
    color: "#333",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  title: {
    fontSize: "30px",
    fontWeight: "bold",
    color: "#1e293b",
  },
  subtitle: {
    fontSize: "20px",
    fontWeight: 600,
    color: "#334155",
  },
  section: {
    backgroundColor: "#f1f5f9",
    padding: "16px",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  dataRow: {
    fontSize: "16px",
  },
  sectionTotal: {
    backgroundColor: "#e0f7fa",
    padding: "16px",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    border: "1px solid #bae6fd",
  },
  total: {
    fontSize: "17px",
    fontWeight: "bold",
    color: "#0f172a",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "15px",
    minWidth: "600px",
  },
  headerRow: {
    backgroundColor: "#f1f5f9",
  },
  cell: {
    padding: "10px",
    textAlign: "left",
    borderBottom: "1px solid #e2e8f0",
  },
  backLink: {
    marginTop: "16px",
    fontWeight: "bold",
    color: "#2563eb",
    textDecoration: "none",
    alignSelf: "flex-start",
  },
};
