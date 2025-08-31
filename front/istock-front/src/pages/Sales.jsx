// src/pages/Sales.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getSalesPaged, getAllSales, deleteSale } from "../services/sales";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination";
import { moneyUSD, moneyARS } from "../utils/format"; // 👈 helpers de formato

export default function Sales() {
  const [sales, setSales] = useState([]);          // lista paginada (modo normal)
  const [allSales, setAllSales] = useState([]);    // lista completa (modo mes)

  // filtros
  const [typed, setTyped] = useState("");          // input del buscador con debounce
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");          // 'YYYY-MM' (input type=month)

  // paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [loading, setLoading] = useState(false);

  // Modo “mes”: si hay mes seleccionado, se filtra localmente
  const filterByMonth = Boolean(month);

  // helpers de fecha/hora y orden
  const ts = (v) => (v?.fecha ? new Date(v.fecha).getTime() : 0);
  const sortByFechaDesc = (a, b) => ts(b) - ts(a);
  const fmtDateTime = (s) =>
    s
      ? new Date(s).toLocaleString(undefined, {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "-";

  // debounce buscador (300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(typed.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [typed]);

  // Traer ventas (modo normal: paginado en backend)
  const fetchPaged = async () => {
    setLoading(true);
    try {
      const res = await getSalesPaged({ page, pageSize, search });
      if (Array.isArray(res)) {
        // fallback por si el back devolviera array
        const sorted = [...res].sort(sortByFechaDesc);
        const start = (page - 1) * pageSize;
        setSales(sorted.slice(start, start + pageSize));
        setTotalItems(res.length);
      } else {
        const items = Array.isArray(res.items) ? res.items : [];
        const sorted = [...items].sort(sortByFechaDesc);
        setSales(sorted);
        setTotalItems(res.totalItems || items.length || 0);
      }
    } catch (e) {
      console.error("Error al obtener ventas:", e);
    } finally {
      setLoading(false);
    }
  };

  // Traer ventas completas cuando cambia el mes (modo “mes”)
  useEffect(() => {
    if (!filterByMonth) return;
    setLoading(true);
    getAllSales()
      .then((data) => setAllSales(Array.isArray(data) ? data : []))
      .catch((e) => console.error("Error al obtener ventas (all):", e))
      .finally(() => setLoading(false));
  }, [filterByMonth]);

  // Modo normal: re-fetch al cambiar page/pageSize/search si NO hay mes
  useEffect(() => {
    if (filterByMonth) return; // en modo mes no usamos paginado del back
    fetchPaged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, filterByMonth]);

  // Reset de página cuando cambio el mes
  useEffect(() => {
    setPage(1);
  }, [month]);

  // Filtrado local cuando hay “month”
  const { shownSales, shownTotal } = useMemo(() => {
    if (!filterByMonth) {
      // por las dudas re-ordenamos acá también
      const sorted = [...sales].sort(sortByFechaDesc);
      return { shownSales: sorted, shownTotal: totalItems };
    }

    // rangos del mes
    const [y, m] = month.split("-").map(Number); // YYYY, MM
    const from = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const to = new Date(y, m, 0, 23, 59, 59, 999); // último día del mes

    // filtrar por fecha y por cliente (search)
    const filtered = (allSales || []).filter((v) => {
      const fecha = v?.fecha ? new Date(v.fecha) : null;
      if (!fecha) return false;
      const inMonth = fecha >= from && fecha <= to;
      const matchesSearch = search
        ? String(v?.cliente || "").toLowerCase().includes(search.toLowerCase())
        : true;
      return inMonth && matchesSearch;
    });

    // ordenar desc por fecha antes de paginar
    const sorted = filtered.sort(sortByFechaDesc);

    // paginar localmente
    const start = (page - 1) * pageSize;
    const pageItems = sorted.slice(start, start + pageSize);
    return { shownSales: pageItems, shownTotal: filtered.length };
  }, [filterByMonth, allSales, sales, totalItems, month, page, pageSize, search]);

  // Info de paginación
  const pagInfo = useMemo(() => {
    const total = Number(shownTotal ?? 0);
    if (!total) return "0 de 0";
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return `${from}-${to} de ${total}`;
  }, [page, pageSize, shownTotal]);

  // Eliminar
  const handleDelete = async (ventaId) => {
    if (!confirm("¿Estás seguro de eliminar esta venta?")) return;
    try {
      await deleteSale(ventaId);
      if (filterByMonth) {
        // En modo mes, recargo todo y el filtrado se aplica solo
        const data = await getAllSales();
        setAllSales(Array.isArray(data) ? data : []);
      } else {
        // si borrás el último de la página, retrocede una
        if (shownSales.length === 1 && page > 1) setPage((p) => p - 1);
        else fetchPaged();
      }
    } catch (e) {
      console.error("Error al eliminar venta:", e);
    }
  };

  return (
    <div className="body-bg" style={{ padding: 24 }}>
      {/* Encabezado */}
      <div
        className="sales-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}
      >
        <h1 className="products-title">VENTAS</h1>
        <Link to="/ventas/nueva" className="add-product-btn">+ Nueva Venta</Link>
      </div>

      {/* Barra superior: buscador + mes + page size */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Buscar por cliente..."
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", width: 260 }}
        />

        {/* Filtro por mes (YYYY-MM) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 14, color: "#555" }}>Mes</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ padding: "8px", borderRadius: 6, border: "1px solid #ccc" }}
          />
          {month && (
            <button
              type="button"
              onClick={() => setMonth("")}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
              title="Quitar filtro de mes"
            >
              Limpiar
            </button>
          )}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#555" }}>Filas por página</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}
            style={{ padding: "8px", borderRadius: 6, border: "1px solid #ccc", width: 80 }}
          >
            {[5, 10, 20, 50].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
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
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 18 }}>Cargando...</td></tr>
            ) : shownSales.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 18 }}>Sin ventas</td></tr>
            ) : (
              shownSales.map((venta, idx) => {
                const totalUSD = Number(venta?.precioTotal ?? 0);
                const gainUSD = Number(venta?.gananciaTotal ?? 0);
                const gainARS = (Number(venta?.valorDolar ?? 0) * gainUSD) || 0;

                return (
                  <tr key={venta.idVenta || `${page}-${idx}`}>
                    <td>{fmtDateTime(venta?.fecha)}</td>
                    <td>{venta?.cliente || "-"}</td>
                    <td>{moneyUSD(totalUSD)}</td>
                    <td>{moneyUSD(gainUSD)}</td>
                    <td>{moneyARS(gainARS)}</td>
                    <td>{venta?.equipoPartePago || "-"}</td>
                    <td>
                      <Link to={`/ventas/detalle/${venta.idVenta}`} className="action-btn">Ver detalle</Link>
                    </td>
                    <td>
                      <Link to={`/ventas/editar/${venta.idVenta}`} className="action-btn edit">Editar</Link>
                      <button className="action-btn delete" onClick={() => handleDelete(venta.idVenta)}>Eliminar</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Info + Paginación */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, color: "#555" }}>{pagInfo}</span>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={shownTotal}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
