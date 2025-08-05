import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEstadisticas, getProductosBajoStock } from "../services/dashboard";

export default function Home() {
  const [ventasSemanales, setVentasSemanales] = useState([]);
  const [ventasMensuales, setVentasMensuales] = useState([]);
  const [gananciaSemanal, setGananciaSemanal] = useState(0);
  const [gananciaMensual, setGananciaMensual] = useState(0);
  const [gananciaSemanalArs, setGananciaSemanalArs] = useState(0);
  const [gananciaMensualArs, setGananciaMensualArs] = useState(0);
  const [productosBajoStock, setProductosBajoStock] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    getEstadisticas()
      .then((data) => {
        
        setVentasSemanales(data.ventasSemanales);
        setVentasMensuales(data.ventasMensuales);
        setGananciaSemanal(data.gananciaSemanal);
        setGananciaMensual(data.gananciaMensual);
        setGananciaSemanalArs(data.gananciaSemanalArs);
        setGananciaMensualArs(data.gananciaMensualArs);
      })
      .catch((err) => {
        console.error("❌ Error estadísticas:", err.message);
      });

    getProductosBajoStock()
      .then((data) => {
        
        setProductosBajoStock(Array.isArray(data) ? data : [data]);
      })
      .catch((err) => {
        console.error("❌ Error stock bajo:", err.message);
      });
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>📊 Dashboard</h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 32 }}>
        <div style={cardStyle} onClick={() => navigate("/ventas/semanal")}>
          <h3>Ventas Semanales</h3>
          <p style={countStyle}>{ventasSemanales.length}</p>
        </div>

        <div style={cardStyle} onClick={() => navigate("/ventas/mensual")}>
          <h3>Ventas Mensuales</h3>
          <p style={countStyle}>{ventasMensuales.length}</p>
        </div>

        <div style={cardStyle}>
          <h3>Ganancia Semanal (USD)</h3>
          <p style={countStyle}>${gananciaSemanal.toFixed(2)}</p>
        </div>

        <div style={cardStyle}>
          <h3>Ganancia Mensual (USD)</h3>
          <p style={countStyle}>${gananciaMensual.toFixed(2)}</p>
        </div>

        <div style={cardStyle}>
          <h3>Ganancia Semanal (ARS)</h3>
          <p style={countStyle}>${gananciaSemanalArs.toFixed(2)}</p>
        </div>

        <div style={cardStyle}>
          <h3>Ganancia Mensual (ARS)</h3>
          <p style={countStyle}>${gananciaMensualArs.toFixed(2)}</p>
        </div>
      </div>

      <h3>📦 Productos con stock bajo o mínimo</h3>
      {productosBajoStock.length === 0 ? (
        <p>No hay productos con stock bajo.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Stock Actual</th>
              <th style={thStyle}>Stock Mínimo</th>
            </tr>
          </thead>
          <tbody>
            {productosBajoStock.map((prod) => (
              <tr key={prod.idProducto}>
                <td style={tdStyle}>{prod.nombre}</td>
                <td style={tdStyle}>{prod.stockActual}</td>
                <td style={tdStyle}>{prod.stockMinimo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const cardStyle = {
  border: "1px solid #ddd",
  padding: 16,
  borderRadius: 8,
  width: 220,
  background: "#f9f9f9",
  boxShadow: "2px 2px 6px rgba(0,0,0,0.1)",
  cursor: "pointer",
};

const countStyle = {
  fontSize: 28,
  marginTop: 8,
  fontWeight: "bold",
};

const tableStyle = {
  width: "100%",
  marginTop: 16,
  borderCollapse: "collapse",
};

const thStyle = {
  borderBottom: "2px solid #ccc",
  textAlign: "left",
  padding: 8,
};

const tdStyle = {
  borderBottom: "1px solid #eee",
  padding: 8,
};
