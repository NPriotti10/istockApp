import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { getPurchaseById } from "../services/purchases";

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

  const money = (n) => `$${Number(n || 0).toFixed(2)}`;

  // Normalizo ítems para soportar ambos formatos (nuevo y antiguo)
  const items = useMemo(() => {
    if (!purchase) return [];
    if (Array.isArray(purchase.items)) {
      // Nuevo formato
      return purchase.items.map((it) => ({
        nombre: it.nombre ?? "",
        descripcion: it.descripcion ?? "",
        precio: Number(it.precioCosto ?? 0),
        cantidad: Number(it.cantidad ?? 1),
      }));
    }
    if (Array.isArray(purchase.productos)) {
      // Formato anterior
      return purchase.productos.map((p) => ({
        nombre: p.nombreProducto ?? p.nombre ?? "",
        descripcion: p.descripcion ?? "",
        precio: Number(p.precioUnitario ?? p.precioCosto ?? 0),
        cantidad: Number(p.cantidad ?? 1),
      }));
    }
    return [];
  }, [purchase]);

  const totalCalculado = useMemo(
    () => items.reduce((acc, it) => acc + it.precio * it.cantidad, 0),
    [items]
  );

  if (loading) return <p style={{ padding: 32 }}>Cargando compra...</p>;
  if (!purchase) return <p style={{ padding: 32 }}>No se encontró la compra.</p>;

  const { proveedor, fecha } = purchase;
  const totalMostrar =
    typeof purchase.precioTotal === "number" ? purchase.precioTotal : totalCalculado;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🧾 Detalle de compra</h2>

      <div style={styles.section}>
        <div style={styles.dataRow}>
          <strong>Proveedor:</strong> {proveedor || "-"}
        </div>
        <div style={styles.dataRow}>
          <strong>Fecha:</strong>{" "}
          {fecha ? new Date(fecha).toLocaleDateString() : "-"}
        </div>
      </div>

      <h3 style={styles.subtitle}>📦 LISTADO DE ÍTEMS</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.cell}>Producto</th>
              <th style={styles.cell}>Descripción</th>
              <th style={styles.cellNum}>Cantidad</th>
              <th style={styles.cellNum}>Precio USD</th>
              <th style={styles.cellNum}>Subtotal USD</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td style={styles.cell} colSpan={5}>
                  Sin ítems en esta compra.
                </td>
              </tr>
            ) : (
              items.map((it, idx) => {
                const subtotal = it.precio * it.cantidad;
                const zebra = idx % 2 === 0 ? "#f8fafc" : "white";
                return (
                  <tr
                    key={`${it.nombre}-${idx}`}
                    style={{
                      backgroundColor: zebra,
                      transition: "background-color 0.2s ease-in-out",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#e0f2fe")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = zebra)
                    }
                  >
                    <td style={styles.cell}>{it.nombre}</td>
                    <td style={styles.cell}>{it.descripcion}</td>
                    <td style={styles.cellNum}>{it.cantidad}</td>
                    <td style={styles.cellNum}>{money(it.precio)}</td>
                    <td style={styles.cellNum}>
                      <strong>{money(subtotal)}</strong>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.sectionTotal}>
        <p style={styles.total}>
          <strong>💵 PRECIO TOTAL:</strong> {money(totalMostrar)} USD
        </p>
        {typeof purchase.precioTotal !== "number" && (
          <p style={{ margin: 0, color: "#64748b" }}>
            (Calculado en frontend)
          </p>
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
    minWidth: "760px",
  },
  headerRow: {
    backgroundColor: "#f1f5f9",
  },
  cell: {
    padding: "10px",
    textAlign: "left",
    borderBottom: "1px solid #e2e8f0",
  },
  cellNum: {
    padding: "10px",
    textAlign: "right",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  backLink: {
    marginTop: "16px",
    fontWeight: "bold",
    color: "#2563eb",
    textDecoration: "none",
    alignSelf: "flex-start",
  },
};
