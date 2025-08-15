// src/pages/VentasPorPeriodo.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAllSales } from "../services/sales"; // usa axios + token
import Pagination from "../components/Pagination";

export default function VentasPorPeriodo() {
  const { periodo: periodoParam } = useParams(); // "semanal" | "mensual"
  const navigate = useNavigate();
  const periodo = (periodoParam || "semanal").toLowerCase();

  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErr("");
      try {
        const all = await getAllSales();

        if (!mounted) return;

        const hoy = new Date();
        hoy.setHours(23, 59, 59, 999);

        let inicioPeriodo;
        if (periodo === "semanal") {
          const dia = hoy.getDay();         // 0=dom,1=lun...
          const desdeLunes = (dia + 6) % 7; // 0 si es lunes
          inicioPeriodo = new Date(hoy);
          inicioPeriodo.setDate(hoy.getDate() - desdeLunes);
          inicioPeriodo.setHours(0, 0, 0, 0);
        } else {
          // mensual (fallback)
          inicioPeriodo = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          inicioPeriodo.setHours(0, 0, 0, 0);
        }

        const filtradas = (Array.isArray(all) ? all : [])
          .filter((v) => {
            const raw = v.fecha ?? v.Fecha ?? v.date ?? v.Date;
            if (!raw) return false;
            const f = new Date(raw);
            return !isNaN(f.getTime()) && f >= inicioPeriodo && f <= hoy;
          })
          .sort((a, b) => {
            const fa = new Date(a.fecha ?? a.Fecha ?? a.date ?? a.Date);
            const fb = new Date(b.fecha ?? b.Fecha ?? b.date ?? b.Date);
            return fb - fa;
          });

        setVentas(filtradas);
      } catch (e) {
        console.error("Error al cargar ventas:", e);
        setErr("No se pudieron cargar las ventas");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    // reset page cuando cambia el período
    setPage(1);

    return () => { mounted = false; };
  }, [periodo]);

  // Clamp de página si cambia el total o el pageSize
  const totalItems = ventas.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalItems, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const pagedVentas = useMemo(() => {
    const start = (page - 1) * pageSize;
    return ventas.slice(start, start + pageSize);
  }, [ventas, page, pageSize]);

  const pagInfo = useMemo(() => {
    if (!totalItems) return "0 de 0";
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalItems);
    return `${from}-${to} de ${totalItems}`;
  }, [page, pageSize, totalItems]);

  const currency = (n) => (Number.isFinite(+n) ? `$${(+n).toFixed(2)}` : "$0.00");
  const titulo = periodo === "semanal" ? "semanales" : "mensuales";

  const goTo = (p) => navigate(`/ventas/periodo/${p}`);

  const styles = {
    wrap: { padding: 24, maxWidth: 1000, margin: "0 auto" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 },
    btns: { display: "flex", gap: 8, flexWrap: "wrap" },
    btn: (active) => ({
      padding: "8px 12px",
      borderRadius: 8,
      border: `1px solid ${active ? "#2563eb" : "#cbd5e1"}`,
      background: active ? "#2563eb" : "#fff",
      color: active ? "#fff" : "#0f172a",
      cursor: "pointer",
      fontWeight: 600,
    }),
    bar: { display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" },
    card: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
      overflow: "hidden",
    },
    tableWrap: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
    th: {
      textAlign: "left",
      padding: "12px 14px",
      background: "#f8fafc",
      borderBottom: "1px solid #e5e7eb",
      fontSize: 13,
      color: "#334155",
      position: "sticky",
      top: 0,
      zIndex: 1,
    },
    td: { padding: "12px 14px", borderBottom: "1px solid #f1f5f9", color: "#475569" },
    action: {
      padding: "6px 10px",
      background: "#2563eb",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      fontWeight: 600,
    },
    muted: { color: "#64748b" },
    error: { color: "#dc2626", marginTop: 8 },
    footer: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" },
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>Ventas {titulo}</h2>
        <div style={styles.btns}>
          <button style={styles.btn(periodo === "semanal")} onClick={() => goTo("semanal")}>
            Semanal
          </button>
          <button style={styles.btn(periodo === "mensual")} onClick={() => goTo("mensual")}>
            Mensual
          </button>
        </div>
      </div>

      {/* barra superior: selector de page size */}
      <div style={styles.bar}>
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

      {loading ? (
        <p style={styles.muted}>Cargando ventas…</p>
      ) : err ? (
        <p style={styles.error}>{err}</p>
      ) : totalItems === 0 ? (
        <p style={styles.muted}>No hay ventas registradas en este período.</p>
      ) : (
        <>
          <div className="card" style={styles.card}>
            <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Total del período:</strong>
              <div style={{ fontWeight: 800, color: "#2563eb" }}>
                {currency(ventas.reduce((acc, v) => acc + Number(v.precioTotal ?? v.PrecioTotal ?? 0), 0))}
              </div>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Cliente</th>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>Ganancia</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedVentas.map((venta, idx) => {
                    const id = venta.idVenta ?? venta.IdVenta ?? venta.id ?? venta.Id ?? `${page}-${idx}`;
                    const total = Number(venta.precioTotal ?? venta.PrecioTotal ?? 0);
                    const ganancia = Number(venta.gananciaTotal ?? venta.GananciaTotal ?? 0);
                    const fRaw = venta.fecha ?? venta.Fecha ?? venta.date ?? venta.Date;
                    const fechaStr = fRaw ? new Date(fRaw).toLocaleDateString() : "-";
                    return (
                      <tr key={id}>
                        <td style={styles.td}>{venta.cliente ?? venta.Cliente ?? "-"}</td>
                        <td style={styles.td}>{fechaStr}</td>
                        <td style={styles.td}>{currency(total)}</td>
                        <td style={styles.td}>{currency(ganancia)}</td>
                        <td style={styles.td}>
                          <button
                            style={styles.action}
                            onClick={() => navigate(`/ventas/detalle/${id}`)}
                            title="Ver detalle"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* footer: info + paginación */}
          <div style={styles.footer}>
            
            <Pagination page={page} pageSize={pageSize} total={totalItems} onPageChange={(p) => setPage(p)} />
          </div>
        </>
      )}
    </div>
  );
}
