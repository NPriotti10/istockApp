import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function VentasPorPeriodo() {
  const { periodo } = useParams(); // "semanal" o "mensual"
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("http://localhost:7063/api/Ventas")
      .then((res) => res.json())
      .then((data) => {
        const hoy = new Date();
        let inicioPeriodo;

        if (periodo === "semanal") {
          const diaSemana = hoy.getDay(); // 0 domingo, 1 lunes, ...
          const diasDesdeLunes = (diaSemana + 6) % 7;
          inicioPeriodo = new Date(hoy);
          inicioPeriodo.setDate(hoy.getDate() - diasDesdeLunes);
        } else if (periodo === "mensual") {
          inicioPeriodo = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        }

        const ventasFiltradas = data.filter((venta) => {
          const fechaVenta = new Date(venta.fecha);
          return fechaVenta >= inicioPeriodo;
        });

        setVentas(ventasFiltradas);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al cargar ventas:", err);
        setCargando(false);
      });
  }, [periodo]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Ventas {periodo === "semanal" ? "semanales" : "mensuales"}</h2>
      {cargando ? (
        <p>Cargando ventas...</p>
      ) : ventas.length === 0 ? (
        <p>No hay ventas registradas en este período.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr>
              <th style={thStyle}>Cliente</th>
              <th style={thStyle}>Fecha</th>
              <th style={thStyle}>Total</th>
              <th style={thStyle}>Ganancia</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta) => (
              <tr key={venta.idVenta}>
                <td style={tdStyle}>{venta.cliente}</td>
                <td style={tdStyle}>{new Date(venta.fecha).toLocaleDateString()}</td>
                <td style={tdStyle}>${venta.precioTotal}</td>
                <td style={tdStyle}>${venta.gananciaTotal}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => navigate(`/ventas/detalle/${venta.idVenta}`)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle = {
  borderBottom: "2px solid #ccc",
  padding: 8,
  textAlign: "left",
};

const tdStyle = {
  borderBottom: "1px solid #eee",
  padding: 8,
};
