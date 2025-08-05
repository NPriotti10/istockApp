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
    productos,
    valorDolar,
    equipoPartePago,
    precioTotal,
    gananciaTotal,
  } = venta;

  return (
    <div
      style={{
        padding: 32,
        maxWidth: "1000px",
        margin: "auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#333",
        backgroundColor: "#f9f9f9",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2 style={{ marginBottom: 20, fontSize: 28, color: "#222" }}>
        Detalle de venta
      </h2>

      <p><strong>Cliente:</strong> {cliente}</p>
      <p><strong>Fecha:</strong> {new Date(fecha).toLocaleDateString()}</p>
      {formaPago && <p><strong>Forma de pago:</strong> {formaPago}</p>}
      <p><strong>Valor del dólar:</strong> {valorDolar || 0} ARS</p>
      <p><strong>Equipo tomado como parte de pago:</strong> {equipoPartePago || "Ninguno"}</p>
      <p><strong>Precio total:</strong> ${precioTotal} USD</p>
      <p><strong>Ganancia total:</strong> ${gananciaTotal} USD</p>

      <h3 style={{ marginTop: 32, marginBottom: 12, fontSize: 20, color: "#444" }}>
        Productos vendidos
      </h3>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <thead>
          <tr style={{ backgroundColor: "#e9ecef", fontWeight: 600 }}>
            <th style={thTdStyle}>Producto</th>
            <th style={thTdStyle}>Cantidad</th>
            <th style={thTdStyle}>Precio USD</th>
            <th style={thTdStyle}>Precio ARS</th>
            <th style={thTdStyle}>Ganancia USD</th>
            <th style={thTdStyle}>Ganancia ARS</th>
          </tr>
        </thead>
        <tbody>
          {productos?.map((item, idx) => (
            <tr
              key={idx}
              style={{
                backgroundColor: idx % 2 === 0 ? "#f2f2f2" : "white",
                transition: "background-color 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e0f7fa")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#f2f2f2" : "white")
              }
            >
              <td style={thTdStyle}>{item.nombreProducto}</td>
              <td style={thTdStyle}>{item.cantidad}</td>
              <td style={thTdStyle}>${item.precioUnitario}</td>
              <td style={thTdStyle}>${(item.precioUnitario * valorDolar).toFixed(2)}</td>
              <td style={thTdStyle}>${item.ganancia}</td>
              <td style={thTdStyle}>${(item.ganancia * valorDolar).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Link
        to="/ventas"
        style={{
          display: "inline-block",
          marginTop: 24,
          color: "#007bff",
          textDecoration: "none",
          fontWeight: 500,
        }}
        onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
        onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
      >
        ← Volver a ventas
      </Link>
    </div>
  );
}

// Estilo de celdas
const thTdStyle = {
  padding: "10px",
  textAlign: "left",
  borderBottom: "1px solid #ddd",
};
