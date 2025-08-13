import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEstadisticas, getProductosBajoStock } from "../services/dashboard";
import { getGastosFijos } from "../services/gastosFijos";
import { getDolarValue } from "../services/dolar";

export default function Home() {
  const [ventasSemanales, setVentasSemanales] = useState([]);
  const [ventasMensuales, setVentasMensuales] = useState([]);
  const [gananciaSemanal, setGananciaSemanal] = useState(0);
  const [gananciaMensual, setGananciaMensual] = useState(0);
  const [gananciaSemanalArs, setGananciaSemanalArs] = useState(0);
  const [gananciaMensualArs, setGananciaMensualArs] = useState(0);
  const [gananciaMensualUSDNeta, setGananciaMensualUSDNeta] = useState(0);
  const [productosBajoStock, setProductosBajoStock] = useState([]);
  const [gastosFijos, setGastosFijos] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    getEstadisticas()
      .then((data) => {
        setVentasSemanales(data.ventasSemanales);
        setVentasMensuales(data.ventasMensuales);
        setGananciaSemanal(data.gananciaSemanalUSD);
        setGananciaMensual(data.gananciaMensualUSD);
        setGananciaSemanalArs(data.gananciaSemanalARS);
        setGananciaMensualArs(data.gananciaMensualARS);
        setGananciaMensualUSDNeta(data.gananciaMensualUSDNeta);
      })
      .catch((err) => console.error("❌ Error estadísticas:", err.message));

    getDolarValue().catch(() => {});
    getProductosBajoStock()
      .then((data) => setProductosBajoStock(Array.isArray(data) ? data : []))
      .catch((err) => console.error("❌ Error stock bajo:", err.message));

    getGastosFijos()
      .then((total) => {
        const totalGastos = total.reduce((acc, item) => acc + item.monto, 0);
        setGastosFijos(totalGastos);
      })
      .catch((err) => console.error("❌ Error gastos fijos:", err.message));
  }, []);

  return (
    <div className="home">
      <style>{`
        :root{
          --bg:#f6f8fb;
          --card:#ffffff;
          --text:#0f172a;
          --muted:#64748b;
          --border:#e6eaf0;
          --brand:#2557d6;
          --brand-weak:#e8eeff;
          --success:#0ea57a;
          --danger:#ef4444;
          --radius:16px;
          --shadow:0 2px 10px rgba(16,24,40,.06);
          --shadow-strong:0 8px 24px rgba(16,24,40,.08);
        }

        *{box-sizing:border-box}
        html,body,#root{height:100%}
        body{background:var(--bg); color:var(--text); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;}

        .home{max-width:1100px; margin:0 auto; padding:28px 20px 48px}

        /* Header */
        .header{
          display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:22px;
        }
        .title{font-size:28px; font-weight:800; margin:0}
        .subtitle{margin:6px 0 0; color:var(--muted); font-size:14px}
        .divider{height:1px; background:var(--border); margin:14px 0 8px}

        /* KPI grid superior */
        .kpi-grid{
          display:grid; gap:14px;
          grid-template-columns: repeat(4, minmax(0,1fr));
        }
        @media (max-width: 1000px){
          .kpi-grid{grid-template-columns: repeat(2, minmax(0,1fr));}
        }
        @media (max-width: 560px){
          .kpi-grid{grid-template-columns: 1fr;}
        }

        .kpi {
          background: var(--card);
          border: 1px solid #c7d2e5; /* borde más visible en KPIs */
          border-radius: var(--radius);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 14px 16px;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .kpi__top{
          display:flex; align-items:center; justify-content:space-between; gap:8px;
        }
        .kpi__label{font-size:13px; color:var(--muted)}
        .kpi__badge{
          font-size:11px; color:#334155; background:var(--brand-weak);
          padding:4px 8px; border-radius:999px; border:1px solid #dbe4ff;
        }
        .kpi__value{
          font-size:26px; font-weight:800; letter-spacing:.2px; color:var(--brand); line-height:1.1;
        }
        .kpi--click{cursor:pointer; transition:transform .15s ease, box-shadow .15s ease}
        .kpi--click:hover{transform:translateY(-2px); box-shadow:var(--shadow-strong)}

        /* Secciones */
        .section{margin-top:24px}
        .section__title{
          font-size:16px; font-weight:800; margin:0 0 12px; display:flex; align-items:center; gap:8px;
        }
        .pill{
          width:8px; height:8px; border-radius:999px; background:var(--brand);
          box-shadow:0 0 0 3px var(--brand-weak);
        }

        /* Grids de contenido */
        .grid-2{
          display:grid; gap:14px;
          grid-template-columns: repeat(2, minmax(0,1fr));
        }
        @media (max-width: 820px){
          .grid-2{grid-template-columns: 1fr;}
        }

        .card {
          background: var(--card);
          border: 1px solid #d0d7e3; /* borde más visible */
          border-radius: var(--radius);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); /* sombra más fuerte */
          padding: 16px;
}
        .metric{
          display:flex; align-items:center; justify-content:space-between; gap:12px;
        }
        .metric__label{font-size:13px; color:var(--muted)}
        .metric__value{font-size:24px; font-weight:800; color:var(--brand)}
        .metric--success .metric__value{color:var(--success)}
        .metric--danger .metric__value{color:var(--danger)}

        /* Tabla */
        .table-card {
          border: 1px solid #d0d7e3; /* resalta la tabla */
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .table-wrap{max-height:380px; overflow:auto}
        table{width:100%; border-collapse:separate; border-spacing:0}
        thead th{
          position:sticky; top:0; background:#f3f6fb; z-index:1;
          font-size:13px; color:#334155; text-align:left; padding:12px 14px; border-bottom:1px solid var(--border);
        }
        tbody td{padding:12px 14px; border-bottom:1px solid var(--border); font-size:14px; color:#475569}
        tbody tr:nth-child(even){background:#fafcff}
        tbody tr:hover{background:#f5f8ff}

        /* Helpers */
        .muted{color:var(--muted)}
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
        <div className="kpi kpi--click" onClick={() => navigate("/ventas/semanal")}>
          <div className="kpi__top">
            <span className="kpi__label">Ventas semanales</span>
            
          </div>
          <div className="kpi__value">{ventasSemanales.length}</div>
        </div>

        <div className="kpi kpi--click" onClick={() => navigate("/ventas/mensual")}>
          <div className="kpi__top">
            <span className="kpi__label">Ventas mensuales</span>
            <span className="kpi__badge">Mes actual</span>
          </div>
          <div className="kpi__value">{ventasMensuales.length}</div>
        </div>

        <div className="kpi">
          <div className="kpi__top">
            <span className="kpi__label">Ganancia semanal</span>
            <span className="kpi__badge">USD</span>
          </div>
          <div className="kpi__value">${(gananciaSemanal ?? 0).toFixed(2)}</div>
        </div>

        <div className="kpi">
          <div className="kpi__top">
            <span className="kpi__label">Ganancia mensual</span>
            <span className="kpi__badge">USD</span>
          </div>
          <div className="kpi__value">${(gananciaMensual ?? 0).toFixed(2)}</div>
        </div>
      </div>

      {/* Ganancias en ARS */}
      <section className="section">
        <h3 className="section__title"><span className="pill" /> GANANCIAS (ARS)</h3>
        <div className="grid-2">
          <div className="card metric">
            <span className="metric__label">SEMANAL</span>
            <span className="metric__value">${(gananciaSemanalArs ?? 0).toFixed(2)}</span>
          </div>
          <div className="card metric">
            <span className="metric__label">MENSUAL</span>
            <span className="metric__value">${(gananciaMensualArs ?? 0).toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Neta vs Gastos */}
      <section className="section">
        <h3 className="section__title"><span className="pill" /> GANANACIA NETA VS GASTOS</h3>
        <div className="grid-2">
          <div className="card metric metric--success">
            <span className="metric__label">Ganancia mensual neta (USD)</span>
            <span className="metric__value">${(gananciaMensualUSDNeta ?? 0).toFixed(2)}</span>
          </div>
          <div className="card metric metric--danger">
            <span className="metric__label">Gastos del mes (USD)</span>
            <span className="metric__value">${Number(gastosFijos).toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Stock bajo */}
      <section className="section">
        <h3 className="section__title"><span className="pill" /> PRODUCTOS CON BAJO STOCK</h3>
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
                  </tr>
                </thead>
                <tbody>
                  {productosBajoStock.map((p) => (
                    <tr key={p.idProducto}>
                      <td>{p.nombre}</td>
                      <td>{p.stockActual}</td>
                      <td>{p.stockMinimo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
