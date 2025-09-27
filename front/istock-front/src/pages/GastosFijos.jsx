// src/pages/GastosFijos.jsx
import { useEffect, useMemo, useState } from "react";
import {
  getGastosFijos,
  addGastoFijo,
  deleteGastoFijo,
} from "../services/gastosFijos";

export default function GastosFijos() {
  const [gastos, setGastos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState("Pesos"); // "Pesos" | "Dolares"
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // ---- helpers de formato ----
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

  // ---- carga ----
  async function load() {
    setLoadingList(true);
    setErr("");
    try {
      const data = await getGastosFijos();
      setGastos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("❌ Error al obtener gastos:", e);
      setErr("No se pudieron cargar los gastos.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Totales separados por moneda
  const { totalUSD, totalARS } = useMemo(() => {
    return (Array.isArray(gastos) ? gastos : []).reduce(
      (acc, g) => {
        const val = Number(g?.monto ?? g?.Monto ?? 0);
        const t = (g?.tipo ?? g?.Tipo ?? "").toString();
        const isARS = t === "Pesos" || t === "0";
        if (isARS) acc.totalARS += val;
        else acc.totalUSD += val;
        return acc;
      },
      { totalUSD: 0, totalARS: 0 }
    );
  }, [gastos]);

  const canSubmit =
    nombre.trim() &&
    !Number.isNaN(Number(monto)) &&
    Number(monto) > 0 &&
    (tipo === "Pesos" || tipo === "Dolares");

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!canSubmit || saving) return;

    setSaving(true);
    setErr("");
    try {
      await addGastoFijo({
        nombre: nombre.trim(),
        monto: Number(monto),
        tipo, // "Pesos" | "Dolares"
      });
      setNombre("");
      setMonto("");
      setTipo("Pesos");
      await load();
    } catch (e) {
      console.error("❌ Error al agregar gasto:", e);
      setErr("No se pudo agregar el gasto.");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este gasto fijo?")) return;
    try {
      await deleteGastoFijo(id);
      await load();
    } catch (e) {
      console.error("❌ Error al eliminar gasto:", e);
      setErr("No se pudo eliminar el gasto.");
    }
  };

  return (
    <div className="body-bg">
      <div className="page-wrap">
        {/* Encabezado */}
        <div className="page-header mb-12">
          <div>
            <h1 className="page-title">GASTOS MENSUALES</h1>
            <div className="page-sub">Pesos → Accesorios | Dólares → No-Accesorios</div>
          </div>
        </div>

        {/* Form debajo del título */}
        <form onSubmit={handleSubmit} className="card card-pad row mb-12">
          <div className="row" style={{ flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <small className="page-note">Gasto</small>
              <input
                className="input input--wide"
                value={nombre}
                placeholder="Ej: Alquiler"
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <small className="page-note">
                Monto ({tipo === "Pesos" ? "ARS" : "USD"})
              </small>
              <input
                className="input"
                style={{ width: 140 }}
                value={monto}
                placeholder="Ej: 200"
                type="number"
                step="0.01"
                min="0"
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <small className="page-note">Tipo</small>
              <select
                className="select"
                style={{ width: 200 }}
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="Pesos">Pesos (se descuenta de Accesorios)</option>
                <option value="Dolares">Dólares (se descuenta de No-Accesorios)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="btn-primary"
            style={{ height: 38, opacity: !canSubmit || saving ? 0.7 : 1 }}
            title="Agregar gasto"
          >
            {saving ? "Guardando…" : "➕ Agregar"}
          </button>
        </form>

        {/* Info / Error */}
        {err ? (
          <div
            className="card card-pad mb-12"
            style={{ borderColor: "#FECACA", background: "#FEF2F2", color: "#991B1B" }}
          >
            {err}
          </div>
        ) : (
          <div className="page-note mb-12">
            <strong>Regla:</strong> Gastos <em>en Pesos</em> se descuentan de <em>Accesorios</em> (ARS). Gastos <em>en Dólares</em> se descuentan de <em>No-Accesorios</em> (USD).
          </div>
        )}

        {/* Tabla */}
        <div className="products-table-container table-wrap">
          <table className="products-table table">
            <thead>
              <tr>
                <th style={{ width: "55%" }}>Gasto</th>
                <th style={{ width: "15%" }}>Tipo</th>
                <th style={{ width: "20%" }}>Monto</th>
                <th style={{ width: "10%" }}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loadingList ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 18 }}>
                    Cargando…
                  </td>
                </tr>
              ) : gastos.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 18, color: "#6b7280" }}>
                    No hay gastos mensuales registrados.
                  </td>
                </tr>
              ) : (
                gastos.map((g, idx) => {
                  const id = g.id ?? g.idGastoFijo ?? g.Id ?? g.IdGastoFijo;
                  const nombreG = g.nombre ?? g.Nombre ?? "-";
                  const montoN = Number(g.monto ?? g.Monto ?? 0);
                  const tipoG = (g.tipo ?? g.Tipo ?? "").toString();
                  const isARS = tipoG === "Pesos" || tipoG === "0";

                  return (
                    <tr key={id ?? idx}>
                      <td className="td-truncate">{nombreG}</td>
                      <td>
                        <span
                          className="chip"
                          style={{
                            background: isARS ? "#EEF2FF" : "#ECFDF5",
                            color: isARS ? "#3730A3" : "#065F46",
                            border: "1px solid rgba(0,0,0,0.06)",
                          }}
                        >
                          {isARS ? "Pesos" : "Dólares"}
                        </span>
                      </td>
                      <td className="td-nowrap td-num" style={{ fontWeight: 600 }}>
                        {isARS ? fARS(montoN) : fUSD(montoN)}
                      </td>
                      <td>
                        <button
                          className="action-btn delete"
                          onClick={() => handleEliminar(id)}
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Totales por moneda en el footer */}
            {!loadingList && gastos.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ textAlign: "right", fontWeight: 700 }}>
                    Total mensual USD (No-Acc)
                  </td>
                  <td className="td-nowrap td-num" style={{ fontWeight: 700 }}>{fUSD(totalUSD)}</td>
                  <td />
                </tr>
                <tr>
                  <td colSpan={2} style={{ textAlign: "right", fontWeight: 700 }}>
                    Total mensual ARS (Acc)
                  </td>
                  <td className="td-nowrap td-num" style={{ fontWeight: 700 }}>{fARS(totalARS)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
