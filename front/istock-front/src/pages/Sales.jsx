import React, { useEffect, useState } from "react";
import { getAllSales, deleteSale } from "../services/sales";
import { Link } from "react-router-dom";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getAllSales()
      .then((data) => {
        setSales(data);
      })
      .catch((err) => {
        console.error("Error al obtener ventas:", err);
      });
  }, []);

  const ventasFiltradas = sales.filter((venta) =>
    venta.cliente?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="body-bg" style={{ padding: 24 }}>
        {/* Encabezado */}
      <div className="sales-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 className="products-title">Ventas</h1>
        <Link to="/ventas/nueva" className="add-product-btn">
          + Nueva Venta
        </Link>
      </div>

      {/* 🔍 Buscador por cliente */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Buscar por cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            width: "100%",
            maxWidth: "400px"
          }}
        />
      </div>

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Precio Total (USD)</th>
              <th>Ganancia USD</th>
              <th>Ganancia ARS</th>
              <th>Equipo parte de pago</th>
              <th>Detalle</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: 18 }}>
                  Sin ventas registradas
                </td>
              </tr>
            ) : (
              ventasFiltradas.map((venta, idx) => (
                <tr key={venta.idVenta || idx}>
                  <td>{idx + 1}</td>
                  <td>{new Date(venta.fecha).toLocaleDateString()}</td>
                  <td>{venta.cliente}</td>
                  <td>${venta.precioTotal}</td>
                  <td>${venta.gananciaTotal}</td>
                  <td>
                    ${venta.valorDolar && venta.gananciaTotal
                      ? (venta.valorDolar * venta.gananciaTotal).toFixed(2)
                      : "-"}
                  </td>
                  <td>{venta.equipoPartePago || "-"}</td>
                  <td>
                    <Link to={`/ventas/detalle/${venta.idVenta}`} className="action-btn">
                      Ver detalle
                    </Link>
                  </td>
                  <td>
                    <Link to={`/ventas/editar/${venta.idVenta}`} className="action-btn edit">
                      Editar
                    </Link>
                    <button
                      className="action-btn delete"
                      onClick={() => {
                        if (confirm("¿Estás seguro de eliminar esta venta?")) {
                          deleteSale(venta.idVenta)
                            .then(() =>
                              setSales(sales.filter((v) => v.idVenta !== venta.idVenta))
                            )
                            .catch((err) =>
                              console.error("Error al eliminar venta:", err)
                            );
                        }
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
