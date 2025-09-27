// src/pages/Home.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getEstadisticas, getProductosBajoStock } from "../services/dashboard";
import { getGastosFijos } from "../services/gastosFijos";
import { getDolarValue } from "../services/dolar";
import "../styles/Home.css";

export default function Home() {
  const [ventasSemanales, setVentasSemanales] = useState([]);
  const [ventasMensuales, setVentasMensuales] = useState([]);

  // Ganancias sin accesorios (NO-ACC) - USD/ARS brutas
  const [gananciaSemanal, setGananciaSemanal] = useState(0); // USD
  const [gananciaMensual, setGananciaMensual] = useState(0); // USD
  const [gananciaSemanalArs, setGananciaSemanalArs] = useState(0); // ARS
  const [gananciaMensualArs, setGananciaMensualArs] = useState(0); // ARS

  // Netos mensuales por bucket
  const [gananciaMensualUSDNeta, setGananciaMensualUSDNeta] = useState(0); // Neto NO-ACC en USD (compat)
  const [gananciaMensualNoAccNetaUSD, setGananciaMensualNoAccNetaUSD] = useState(0); // Nuevo
  const [gananciaMensualAccesoriosNetaARS, setGananciaMensualAccesoriosNetaARS] = useState(0); // Nuevo

  // Ganancias accesorios (ARS) brutas
  const [gananciaSemanalAccesoriosArs, setGananciaSemanalAccesoriosArs] = useState(0);
  const [gananciaMensualAccesoriosArs, setGananciaMensualAccesoriosArs] = useState(0);

  // Ingresos (ventas brutas) accesorios con fallback de moneda
  const [ingresosAccSemanal, setIngresosAccSemanal] = useState(0);
  const [ingresosAccMensual, setIngresosAccMensual] = useState(0);
  const [ingresosAccMoneda, setIngresosAccMoneda] = useState("USD");

  // Gastos fijos por tipo
  const [gastosUSD, setGastosUSD] = useState(0); // solo Dólares
  const [gastosARS, setGastosARS] = useState(0); // solo Pesos
  const [gastosLista, setGastosLista] = useState([]);

  // Otros
  const [productosBajoStock, setProductosBajoStock] = useState([]);

  const navigate = useNavigate();

  // Helpers de formato
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

  // Cobertura de gastos por bucket
  const coberturaNoAcc = useMemo(() => {
    const g = Number(gastosUSD || 0);
    if (g <= 0) return 1;
    return Math.max(0, Math.min(1, Number(gananciaMensualNoAccNetaUSD || 0) / g));
  }, [gananciaMensualNoAccNetaUSD, gastosUSD]);

  const coberturaAcc = useMemo(() => {
    const g = Number(gastosARS || 0);
    if (g <= 0) return 1;
    return Math.max(0, Math.min(1, Number(gananciaMensualAccesoriosNetaARS || 0) / g));
  }, [gananciaMensualAccesoriosNetaARS, gastosARS]);

  useEffect(() => {
    getEstadisticas()
      .then((data) => {
        setVentasSemanales(Array.isArray(data.ventasSemanales) ? data.ventasSemanales : []);
        setVentasMensuales(Array.isArray(data.ventasMensuales) ? data.ventasMensuales : []);

        // Brutos NO-ACC
        setGananciaSemanal(Number(data.gananciaSemanalUSD ?? 0));
        setGananciaMensual(Number(data.gananciaMensualUSD ?? 0));
        setGananciaSemanalArs(Number(data.gananciaSemanalARS ?? 0));
        setGananciaMensualArs(Number(data.gananciaMensualARS ?? 0));

        // Accesorios brutos
        setGananciaSemanalAccesoriosArs(Number(data.gananciaSemanalAccesoriosARS ?? 0));
        setGananciaMensualAccesoriosArs(Number(data.gananciaMensualAccesoriosARS ?? 0));

        // Netos por bucket
        setGananciaMensualUSDNeta(Number(data.gananciaMensualUSDNeta ?? 0)); // compat
        setGananciaMensualNoAccNetaUSD(Number(data.gananciaMensualNoAccNetaUSD ?? data.gananciaMensualUSDNeta ?? 0));
        setGananciaMensualAccesoriosNetaARS(Number(data.gananciaMensualAccesoriosNetaARS ?? 0));

        // Gastos por tipo desde estadisticas (más confiable para cobertura)
        setGastosUSD(Number(data.gastosDolaresUSD ?? 0));
        setGastosARS(Number(data.gastosPesosARS ?? 0));

        // Ingresos accesorios (moneda dinámica)
        const semanalUSD = data.ventasAccesoriosSemanalUSD ?? data.ventasAccesoriosSemanalUsd;
        const mensualUSD = data.ventasAccesoriosMensualUSD ?? data.ventasAccesoriosMensualUsd;

        if (semanalUSD != null && mensualUSD != null) {
          setIngresosAccSemanal(Number(semanalUSD) || 0);
          setIngresosAccMensual(Number(mensualUSD) || 0);
          setIngresosAccMoneda("USD");
        } else {
          setIngresosAccSemanal(Number(data.ventasAccesoriosSemanalARS ?? 0));
          setIngresosAccMensual(Number(data.ventasAccesoriosMensualARS ?? 0));
          setIngresosAccMoneda("ARS");
        }
      })
      .catch((err) => console.error("Error estadisticas:", err?.message || err));

    getDolarValue().catch(() => {});
    getProductosBajoStock()
      .then((data) => setProductosBajoStock(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error stock bajo:", err?.message || err));

    // Lista de gastos (para el detalle con moneda por item)
    getGastosFijos()
      .then((rows) => {
        setGastosLista(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => console.error("Error gastos fijos:", err?.message || err));
  }, []);

  const fmtIngresosAcc = ingresosAccMoneda === "USD" ? fUSD : fARS;

  // Para chips de cobertura
  const toPercent = (x) => Math.min(100, Math.max(0, Math.round((Number(x || 0)) * 100)));
  const covNoAccPct = toPercent(coberturaNoAcc);
  const covAccPct = toPercent(coberturaAcc);
  const tone = (pct) => (pct >= 90 ? "positive" : pct >= 60 ? "caution" : "default");

  const lowStockCount = productosBajoStock.length;

  return (
    <div className="home">
      <div className="home__wrap">
        {/* Header */}
        <div className="header">
          <div>
            <span className="header__tag">Dashboard </span>
            <h1 className="title">INFORMACION GENERAL</h1>
          </div>
        </div>

        <div className="divider" />

        {/* KPIs principales */}
        <div className="kpi-grid">
          <div className="kpi kpi--click" onClick={() => navigate("/ventas/periodo/semanal")}>
            <div className="kpi__top">
              <span className="kpi__label">Ventas semanales</span>
              <span className="kpi__badge">Ultimos 7 dias</span>
            </div>
            <div className="kpi__value">{ventasSemanales.length}</div>
          </div>

          <div className="kpi kpi--click" onClick={() => navigate("/ventas/periodo/mensual")}>
            <div className="kpi__top">
              <span className="kpi__label">Ventas mensuales</span>
              <span className="kpi__badge">Mes en curso</span>
            </div>
            <div className="kpi__value">{ventasMensuales.length}</div>
          </div>

          <div className="kpi ">
            <div className="kpi__top">
              <span className="kpi__label">Ingreso bruto semanal</span>
              <span className="kpi__badge">USD sin accesorios</span>
            </div>
            <div className="kpi__value ">{fUSD(gananciaSemanal)}</div>
          </div>

          <div className="kpi">
            <div className="kpi__top">
              <span className="kpi__label">Ingreso bruto mensual</span>
              <span className="kpi__badge">USD sin accesorios</span>
            </div>
            <div className="kpi__value">{fUSD(gananciaMensual)}</div>
          </div>
        </div>

        {/* Ganancias en ARS (sin accesorios) */}
        <section className="section">
          <h3 className="section__title">
            <span className="pill" /> INGRESOS BRUTOS (ARS)
          </h3>
          <p className="section__helper">Seguimiento de ventas brutas sin accesorios.</p>
          <div className="grid-2">
            <div className="card metric metric--blue">
              <span className="metric__label">Semanal</span>
              <span className="metric__value">{fARS(gananciaSemanalArs)}</span>
            </div>
            <div className="card metric metric--blue">
              <span className="metric__label">Mensual</span>
              <span className="metric__value">{fARS(gananciaMensualArs)}</span>
            </div>
          </div>
        </section>

        {/* Ingresos (ventas brutas) de Accesorios */}
        <section className="section">
          <h3 className="section__title">
            <span className="pill pill--acc" /> INGRESOS BRUTOS ACCESORIOS ({ingresosAccMoneda})
          </h3>
          <p className="section__helper">Seguimiento de ventas brutas para accesorios.</p>
          <div className="grid-2">
            <div className="card metric metric--blue">
              <span className="metric__label">Semanal</span>
              <span className="metric__value">{fARS(gananciaSemanalAccesoriosArs)}</span>
            </div>
            <div className="card metric metric--blue">
              <span className="metric__label ">Mensual</span>
              <span className="metric__value">{fARS(gananciaMensualAccesoriosArs)}</span>
            </div>
          </div>
        </section>

        {/* Ganancia versus gastos (Netos por bucket) */}
        <section className="section">
          <h3 className="section__title">
            <span className="pill" /> GANANCIAS NETAS POR BLOQUE
          </h3>
          <p className="section__helper">Neto = Ganancia bruta − Gastos del mismo tipo de moneda</p>
          <div className="grid-2">
            <div className="card metric metric--success">
              <div className="metric__top">
                <span className="metric__label">No-Accesorios (USD)</span>
                
              </div>
              <span className="metric__value">{fUSD(gananciaMensualNoAccNetaUSD)}</span>
              <span className="muted">Gastos USD: {fUSD(gastosUSD)}</span>
            </div>

            <div className="card metric metric--success">
              <div className="metric__top">
                <span className="metric__label">Accesorios (ARS)</span>
                
              </div>
              <span className="metric__value">{fARS(gananciaMensualAccesoriosNetaARS)}</span>
              <span className="muted">Gastos ARS: {fARS(gastosARS)}</span>
            </div>
          </div>
        </section>

        

        {/* Gastos fijos */}
        <section className="section">
          <h3 className="section__title">
            <span className="pill" /> GASTOS FIJOS (por moneda)
          </h3>
          <div className="grid-2">
            <div className="card metric metric--danger">
              <span className="metric__label">Total mensual USD (No-Acc)</span>
              <span className="metric__value">{fUSD(gastosUSD)}</span>
              <div className="spacer-8" />
              <span className="metric__label">Total mensual ARS (Acc)</span>
              <span className="metric__value">{fARS(gastosARS)}</span>
            </div>

            <div className="card">
              <div className="list">
                {gastosLista.length === 0 ? (
                  <span className="muted">No registraste gastos fijos todavia.</span>
                ) : (
                  gastosLista.map((g) => {
                    const tipo = (g?.tipo || "").toString();
                    const isARS = tipo === "Pesos" || tipo === "0"; // por si viniera como número
                    const val = Number(g?.monto ?? 0);
                    return (
                      <div key={g.id} className="list__row">
                        <span className="list__name">{g.nombre}</span>
                        <span className="list__amount">
                          {isARS ? fARS(val) : fUSD(val)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
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
    </div>
  );
}
