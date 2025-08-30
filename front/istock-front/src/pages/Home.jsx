// src/pages/Home.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getEstadisticas, getProductosBajoStock } from "../services/dashboard";
import { getGastosFijos } from "../services/gastosFijos";
import { getDolarValue } from "../services/dolar";

export default function Home() {
  const [ventasSemanales, setVentasSemanales] = useState([]);
  const [ventasMensuales, setVentasMensuales] = useState([]);

  // Ganancias SIN accesorios
  const [gananciaSemanal, setGananciaSemanal] = useState(0);         // USD
  const [gananciaMensual, setGananciaMensual] = useState(0);         // USD
  const [gananciaSemanalArs, setGananciaSemanalArs] = useState(0);   // ARS
  const [gananciaMensualArs, setGananciaMensualArs] = useState(0);   // ARS
  const [gananciaMensualUSDNeta, setGananciaMensualUSDNeta] = useState(0); // USD

  // Ganancias SOLO accesorios (ARS)
  const [gananciaSemanalAccesoriosArs, setGananciaSemanalAccesoriosArs] = useState(0);
  const [gananciaMensualAccesoriosArs, setGananciaMensualAccesoriosArs] = useState(0);

  // Otros
  const [productosBajoStock, setProductosBajoStock] = useState([]);
  const [gastosFijos, setGastosFijos] = useState(0);

  const navigate = useNavigate();

  // === helpers de formato ===
  const fUSD = (n) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n || 0));

  const fARS = (n) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n || 0));

  // Cobertura de gastos: qué porcentaje de los gastos fijos cubre la ganancia mensual (sin accesorios)
  const cobertura = useMemo(() => {
    const g = Number(gastosFijos || 0);
    if (g <= 0) return 1;
    return Math.max(0, Math.min(1, Number(gananciaMensual || 0) / g));
  }, [gananciaMensual, gastosFijos]);

  useEffect(() => {
    getEstadisticas()
      .then((data) => {
        setVentasSemanales(data.ventasSemanales || []);
        setVentasMensuales(data.ventasMensuales || []);

        setGananciaSemanal(data.gananciaSemanalUSD ?? 0);
        setGananciaMensual(data.gananciaMensualUSD ?? 0);
        setGananciaSemanalArs(data.gananciaSemanalARS ?? 0);
        setGananciaMensualArs(data.gananciaMensualARS ?? 0);
        setGananciaMensualUSDNeta(data.gananciaMensualUSDNeta ?? 0);

        setGananciaSemanalAccesoriosArs(data.gananciaSemanalAccesoriosARS ?? 0);
        setGananciaMensualAccesoriosArs(data.gananciaMensualAccesoriosARS ?? 0);
      })
      .catch((err) => console.error("❌ Error estadísticas:", err.message));

    getDolarValue().catch(() => {});
    getProductosBajoStock()
      .then((data) => setProductosBajoStock(Array.isArray(data) ? data : []))
      .catch((err) => console.error("❌ Error stock bajo:", err.message));

    getGastosFijos()
      .then((rows) => {
        const total = rows.reduce((acc, item) => acc + Number(item.monto ?? 0), 0);
        setGastosFijos(total);
      })
      .catch((err) => console.error("❌ Error gastos fijos:", err.message));
  }, []);

  return (
    <div className="home">
      <style>{`
        /* ====== SCOPE SOLO EN HOME ====== */
        .home{
          --bg:#f6f8fb;
          --card:#ffffff;
          --text:#0f172a;
          --muted:#64748b;
          --border:#e6eaf0;
          --brand:#2557d6;
          --brand-weak:#e8eeff;
          --success:#0ea57a;
          --warning:#f59e0b;
          --danger:#ef4444;
          --radius:16px;
          --shadow:0 2px 10px rgba(16,24,40,.06);
          --shadow-strong:0 10px 26px rgba(16,24,40,.10);

          max-width:1100px; margin:0 auto; padding:28px 20px 48px;
          background:var(--bg); color:var(--text);
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
        }
        .home *{ box-sizing:border-box; }

        /* Header */
        .home .header{
          display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:22px;
        }
        .home .title{font-size:28px; font-weight:800; margin:0}
        .home .subtitle{margin:6px 0 0; color:var(--muted); font-size:14px}
        .home .divider{height:1px; background:var(--border); margin:14px 0 8px}

        /* KPI grid superior */
        .home .kpi-grid{
          display:grid; gap:14px;
          grid-template-columns: repeat(4, minmax(0,1fr));
        }
        @media (max-width: 1000px){
          .home .kpi-grid{grid-template-columns: repeat(2, minmax(0,1fr));}
        }
        @media (max-width: 560px){
          .home .kpi-grid{grid-template-columns: 1fr;}
        }

        .home .kpi {
          position:relative;
          background: linear-gradient(180deg,#fff, #f9fbff);
          border: 1px solid #d4dcf1;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 14px 16px;
          transition: transform .15s ease, box-shadow .15s ease, background .2s ease;
          overflow:hidden;
        }
        .home .kpi:after{
          content:"";
          position:absolute; inset:auto -20px -20px auto; width:120px; height:120px;
          background: radial-gradient(closest-side, rgba(37,87,214,.10), transparent 70%);
          transform: rotate(25deg);
        }
        .home .kpi__top{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .home .kpi__label{font-size:12px; color:var(--muted); letter-spacing:.2px}
        .home .kpi__badge{
          font-size:11px; color:#334155; background:#edf2ff;
          padding:4px 8px; border-radius:999px; border:1px solid #dbe4ff;
        }
        .home .kpi__value{
          font-size:28px; font-weight:800; letter-spacing:.2px; color:var(--brand); line-height:1.1;
          margin-top:6px;
        }
        .home .kpi--click{cursor:pointer;}
        .home .kpi--click:hover{transform:translateY(-2px); box-shadow:var(--shadow-strong)}

        /* Secciones */
        .home .section{margin-top:26px}
        .home .section__title{
          font-size:16px; font-weight:800; margin:0 0 12px; display:flex; align-items:center; gap:8px;
        }
        .home .pill{
          width:8px; height:8px; border-radius:999px; background:var(--brand);
          box-shadow:0 0 0 3px var(--brand-weak);
        }
        .home .pill--acc{ background:var(--warning); box-shadow:0 0 0 3px rgba(245,158,11,.18); }

        /* Cards y métricas */
        .home .grid-2{
          display:grid; gap:14px;
          grid-template-columns: repeat(2, minmax(0,1fr));
        }
        @media (max-width: 820px){
          .home .grid-2{grid-template-columns: 1fr;}
        }

        .home .card {
          background:var(--card);
          border:1px solid #d0d7e3;
          border-radius:var(--radius);
          box-shadow:var(--shadow);
          padding:16px;
        }
        .home .metric{
          display:flex; align-items:center; justify-content:space-between; gap:12px;
        }
        .home .metric__label{font-size:13px; color:var(--muted)}
        .home .metric__value{font-size:24px; font-weight:800; color:var(--brand)}
        .home .metric--success .metric__value{color:var(--success)}
        .home .metric--danger .metric__value{color:var(--danger)}
        .home .metric--warn  .metric__value{color:var(--warning)}

        /* Barra de cobertura */
        .home .bar{
          width:100%; height:10px; background:#eef2ff; border-radius:999px; overflow:hidden;
          border:1px solid #dbe4ff;
        }
        .home .bar__fill{
          height:100%; background:linear-gradient(90deg, #22c55e, #3b82f6);
          border-radius:999px;
          transition: width .3s ease;
        }
        .home .bar__label{
          font-size:12px; color:var(--muted); margin-top:8px;
        }

        /* Tabla (scoped) */
        .home .table-card { border: 1px solid #d0d7e3; box-shadow: var(--shadow); }
        .home .table-wrap{max-height:380px; overflow:auto}
        .home table{width:100%; border-collapse:separate; border-spacing:0}
        .home thead th{
          position:sticky; top:0; background:#f3f6fb; z-index:1;
          font-size:13px; color:#334155; text-align:left; padding:12px 14px; border-bottom:1px solid var(--border);
        }
        .home tbody td{padding:12px 14px; border-bottom:1px solid var(--border); font-size:14px; color:#475569}
        .home tbody tr:nth-child(even){background:#fafcff}
        .home tbody tr:hover{background:#f5f8ff}

        .home .chip{
          display:inline-flex; align-items:center; gap:6px;
          padding:3px 8px; border-radius:999px; font-size:12px; font-weight:700;
        }
        .home .chip--danger{ background:#fee2e2; color:#991b1b; border:1px solid #fecaca; }
        .home .chip--warn{ background:#fff7ed; color:#9a3412; border:1px solid #fed7aa; }

        /* Helpers */
        .home .muted{color:var(--muted)}
      `}</style>

      {/* Header */}
      <div className="header">
        <div>
          <h1 className="title">Información general</h1>
          <p className="subtitle">Resumen de ventas, ganancias y alertas de stock</p>
        </div>
      </div>
      <div className="divider" />

      {/* KPIs principales */}
      <div className="kpi-grid">
        <div className="kpi kpi--click" onClick={() => navigate("/ventas/periodo/semanal")}>
          <div className="kpi__top">
            <span className="kpi__label">Ventas semanales</span>
            <span className="kpi__badge">Últimos 7 días</span>
          </div>
          <div className="kpi__value">{ventasSemanales.length}</div>
        </div>

        <div className="kpi kpi--click" onClick={() => navigate("/ventas/periodo/mensual")}>
          <div className="kpi__top">
            <span className="kpi__label">Ventas mensuales</span>
            <span className="kpi__badge">Mes actual</span>
          </div>
          <div className="kpi__value">{ventasMensuales.length}</div>
        </div>

        <div className="kpi">
          <div className="kpi__top">
            <span className="kpi__label">Ganancia semanal</span>
            <span className="kpi__badge">USD (sin accesorios)</span>
          </div>
          <div className="kpi__value">{fUSD(gananciaSemanal)}</div>
        </div>

        <div className="kpi">
          <div className="kpi__top">
            <span className="kpi__label">Ganancia mensual</span>
            <span className="kpi__badge">USD (sin accesorios)</span>
          </div>
          <div className="kpi__value">{fUSD(gananciaMensual)}</div>
        </div>
      </div>

      {/* Ganancias en ARS (sin accesorios) */}
      <section className="section">
        <h3 className="section__title">
          <span className="pill" /> Ganancias (ARS) — sin accesorios
        </h3>
        <div className="grid-2">
          <div className="card metric">
            <span className="metric__label">Semanal</span>
            <span className="metric__value">{fARS(gananciaSemanalArs)}</span>
          </div>
          <div className="card metric">
            <span className="metric__label">Mensual</span>
            <span className="metric__value">{fARS(gananciaMensualArs)}</span>
          </div>
        </div>
      </section>

      {/* Ganancias accesorios (ARS) */}
      <section className="section">
        <h3 className="section__title">
          <span className="pill pill--acc" /> Ganancias de Accesorios (ARS)
        </h3>
        <div className="grid-2">
          <div className="card metric metric--warn">
            <span className="metric__label">Semanal (solo accesorios)</span>
            <span className="metric__value">{fARS(gananciaSemanalAccesoriosArs)}</span>
          </div>
          <div className="card metric metric--warn">
            <span className="metric__label">Mensual (solo accesorios)</span>
            <span className="metric__value">{fARS(gananciaMensualAccesoriosArs)}</span>
          </div>
        </div>
      </section>

      {/* Neta vs Gastos */}
      <section className="section">
        <h3 className="section__title">
          <span className="pill" /> Ganancia Neta vs Gastos (USD)
        </h3>
        <div className="grid-2">
          <div className="card metric metric--success">
            <span className="metric__label">Ganancia mensual neta</span>
            <span className="metric__value">{fUSD(gananciaMensualUSDNeta)}</span>
          </div>
          <div className="card metric metric--danger">
            <span className="metric__label">Gastos fijos del mes</span>
            <span className="metric__value">{fUSD(gastosFijos)}</span>
          </div>
        </div>

       
      </section>

      {/* Stock bajo */}
      <section className="section">
        <h3 className="section__title">
          <span className="pill" /> Productos con bajo stock
        </h3>
        {productosBajoStock.length === 0 ? (
          <div className="card"><span className="muted">No hay productos con stock bajo.</span></div>
        ) : (
          <div className="card table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Stock actual</th>
                    <th>Stock mínimo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {productosBajoStock.map((p) => {
                    const zero = Number(p.stockActual) <= 0;
                    return (
                      <tr key={p.idProducto}>
                        <td>{p.nombre}</td>
                        <td>{p.stockActual}</td>
                        <td>{p.stockMinimo}</td>
                        <td>
                          <span className={`chip ${zero ? "chip--danger" : "chip--warn"}`}>
                            {zero ? "Sin stock" : "Debajo del mínimo"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
