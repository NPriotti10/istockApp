// src/pages/Sales.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getSalesPaged, getAllSales, deleteSale, getSalesStats } from "../services/sales";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination";
import { moneyUSD, moneyARS } from "../utils/format";

export default function Sales() {
  const [sales, setSales] = useState([]);          // lista paginada (modo normal)
  const [allSales, setAllSales] = useState([]);    // lista completa (modo mes)
  const [totals, setTotals] = useState({ totalUSD: 0, totalARS: 0 }); // totales del mes

  // filtros
  const [typed, setTyped] = useState("");          
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");          // formato 'YYYY-MM'

  // paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [loading, setLoading] = useState(false);

  const filterByMonth = Boolean(month);

  // helpers de fecha y formato
  const ts = (v) => (v?.fecha ? new Date(v.fecha).getTime() : 0);
  const sortByFechaDesc = (a, b) => ts(b) - ts(a);
  const fmtDateTime = (s) =>
    s
      ? new Date(s).toLocaleString(undefined, {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "-";

  // debounce buscador (300 ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(typed.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [typed]);

  // Traer ventas paginadas (modo normal)
  const fetchPaged = async () => {
    setLoading(true);
    try {
      const res = await getSalesPaged({ page, pageSize, search });
      if (Array.isArray(res)) {
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

  // Traer todas las ventas cuando se selecciona un mes
  useEffect(() => {
    if (!filterByMonth) return;
    setLoading(true);
    getAllSales()
      .then((data) => setAllSales(Array.isArray(data) ? data : []))
      .catch((e) => console.error("Error al obtener ventas (all):", e))
      .finally(() => setLoading(false));
  }, [filterByMonth]);

  // Obtener totales del mes desde el backend
  useEffect(() => {
    if (!month) {
      setTotals({ totalUSD: 0, totalARS: 0 });
      return;
    }
    const [y, m] = month.split("-").map(Number);
    getSalesStats({ year: y, month: m })
      .then((res) => {
        setTotals({
          totalUSD: Number(res?.totalVentasNoAccesoriosUSD ?? 0),
          totalARS: Number(res?.totalVentasAccesoriosARS ?? 0),
        });
      })
      .catch((e) => {
        console.error("Error obteniendo totales del mes:", e);
        setTotals({ totalUSD: 0, totalARS: 0 });
      });
  }, [month]);

  // Refetch paginado normal si no hay mes
  useEffect(() => {
    if (filterByMonth) return;
    fetchPaged();
  }, [page, pageSize, search, filterByMonth]);

  useEffect(() => {
    setPage(1);
  }, [month]);

  // Filtrado local si hay mes
  const { shownSales, shownTotal } = useMemo(() => {
    if (!filterByMonth) {
      const sorted = [...sales].sort(sortByFechaDesc);
      return { shownSales: sorted, shownTotal: totalItems };
    }

    const [y, m] = month.split("-").map(Number);
    const from = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const to = new Date(y, m, 0, 23, 59, 59, 999);

    const filtered = (allSales || []).filter((v) => {
      const fecha = v?.fecha ? new Date(v.fecha) : null;
      if (!fecha) return false;
      const inMonth = fecha >= from && fecha <= to;
      const matchesSearch = search
        ? String(v?.cliente || "").toLowerCase().includes(search.toLowerCase())
        : true;
      return inMonth && matchesSearch;
    });

    const sorted = filtered.sort(sortByFechaDesc);
    const start = (page - 1) * pageSize;
    const pageItems = sorted.slice(start, start + pageSize);
    return { shownSales: pageItems, shownTotal: filtered.length };
  }, [filterByMonth, allSales, sales, totalItems, month, page, pageSize, search]);

  // Eliminar venta
  const handleDelete = async (ventaId) => {
    if (!confirm("¿Estás seguro de eliminar esta venta?")) return;
    try {
      await deleteSale(ventaId);
      if (filterByMonth) {
        const data = await getAllSales();
        setAllSales(Array.isArray(data) ? data : []);
      } else {
        if (shownSales.length === 1 && page > 1) setPage((p) => p - 1);
        else fetchPaged();
      }
    } catch (e) {
      console.error("Error al eliminar venta:", e);
    }
  };

  return (
    <div className="body-bg">
      <div className="page-wrap">
        {/* Encabezado */}
        <div className="page-header">
          <div>
            <h1 className="page-title">VENTAS</h1>
            <div className="page-sub">Consulta, filtros y acciones</div>
          </div>
          <Link to="/ventas/nueva" className="btn-primary">
            ＋ Nueva venta
          </Link>
        </div>

        {/* Barra superior */}
        <div className="card card-pad row mb-12">
          <input
            type="text"
            placeholder="Buscar por cliente…"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="input input--max360"
          />

          <div className="row" style={{ marginLeft: "auto" }}>
            <label className="page-note">Mes</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="input"
            />
            {month && (
              <button
                type="button"
                onClick={() => setMonth("")}
                className="btn-outline"
                title="Quitar filtro de mes"
              >
                Limpiar
              </button>
            )}

            <span className="page-note">Filas</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
              className="select select--sm"
              style={{ width: 80 }}
            >
              {[5, 10, 20, 50].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="products-table-container table-wrap sticky">
          <table className="products-table table">
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
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 18 }}>
                    Cargando...
                  </td>
                </tr>
              ) : shownSales.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 18 }}>
                    Sin ventas
                  </td>
                </tr>
              ) : (
                shownSales.map((venta, idx) => {
                  const totalUSD = Number(venta?.precioTotal ?? 0);
                  const gainUSD = Number(venta?.gananciaTotal ?? 0);
                  const gainARS =
                    (Number(venta?.valorDolar ?? 0) * gainUSD) || 0;

                  return (
                    <tr key={venta.idVenta || `${page}-${idx}`}>
                      <td className="td-nowrap">{fmtDateTime(venta?.fecha)}</td>
                      <td className="td-truncate">
                        <strong>{venta?.cliente || "-"}</strong>
                      </td>
                      <td className="td-nowrap td-num">{moneyUSD(totalUSD)}</td>
                      <td className="td-nowrap td-num">{moneyUSD(gainUSD)}</td>
                      <td className="td-nowrap td-num">{moneyARS(gainARS)}</td>
                      <td className="td-truncate">
                        {venta?.equipoPartePago || "-"}
                      </td>
                      <td>
                        <Link
                          to={`/ventas/detalle/${venta.idVenta}`}
                          className="action-btn"
                        >
                          Ver detalle
                        </Link>
                      </td>
                      <td>
                        <div className="row">
                          <Link
                            to={`/ventas/editar/${venta.idVenta}`}
                            className="action-btn edit"
                          >
                            Editar
                          </Link>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(venta.idVenta)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Totales mensuales */}
        {filterByMonth && (
          <div
            className="card mt-12"
            style={{
              padding: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 600 }}>
              📊 Totales del mes –{" "}
              {new Date(month + "-01").toLocaleString("es-AR", {
                month: "long",
                year: "numeric",
              })}
            </div>
            <div className="row" style={{ gap: 16 }}>
              <div>
                <span className="page-note">No-accesorios (USD): </span>
                <strong>{moneyUSD(totals.totalUSD)}</strong>
              </div>
              <div>
                <span className="page-note">Accesorios (ARS): </span>
                <strong>{moneyARS(totals.totalARS)}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Info + paginación */}
        <div className="row row--split mt-16">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={shownTotal}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>
    </div>
  );
}
