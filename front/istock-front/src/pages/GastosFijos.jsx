// src/pages/GastosFijos.jsx
import { useEffect, useMemo, useState } from "react";
import {
  getGastosFijos,
  addGastoFijo,
  deleteGastoFijo,
} from "../services/gastosFijos";
import { moneyUSD } from "../utils/format";

export default function GastosFijos() {
  const [gastos, setGastos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

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

  const total = useMemo(
    () => gastos.reduce((acc, g) => acc + Number(g.monto ?? g.Monto ?? 0), 0),
    [gastos]
  );

  const canSubmit =
    nombre.trim() && !Number.isNaN(Number(monto)) && Number(monto) > 0;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!canSubmit || saving) return;

    setSaving(true);
    setErr("");
    try {
      await addGastoFijo({ nombre: nombre.trim(), monto: Number(monto) });
      setNombre("");
      setMonto("");
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

  // estilos mínimos coherentes con el resto
  const input = {
    padding: 8,
    border: "1px solid #ccc",
    borderRadius: 6,
    height: 38,
  };
  const label = { display: "flex", flexDirection: "column", gap: 6 };

  return (
    <div className="body-bg" style={{ padding: 24 }}>
      {/* Encabezado solo con el título */}
      <div
        className="products-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h1 className="products-title">GASTOS MENSUALES</h1>
      </div>

      {/* Form debajo del título */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "end",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div style={label}>
          <small style={{ color: "#555" }}>Gasto</small>
          <input
            style={{ ...input, minWidth: 220 }}
            value={nombre}
            placeholder="Ej: Alquiler"
            onChange={(e) => setNombre(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div style={label}>
          <small style={{ color: "#555" }}>Monto (USD)</small>
          <input
            style={{ ...input, width: 140 }}
            value={monto}
            placeholder="Ej: 120"
            type="number"
            step="0.01"
            min="0"
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit || saving}
          className="add-product-btn"
          style={{
            height: 38,
            opacity: !canSubmit || saving ? 0.7 : 1,
            cursor: !canSubmit || saving ? "not-allowed" : "pointer",
          }}
          title="Agregar gasto"
        >
          {saving ? "Guardando…" : "➕ Agregar"}
        </button>
      </form>

      {/* Error (si existe) */}
      {err ? (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 10px",
            borderRadius: 8,
            background: "#FEF2F2",
            color: "#991B1B",
            border: "1px solid #FECACA",
            fontSize: 14,
          }}
        >
          {err}
        </div>
      ) : null}

      {/* Tabla */}
      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th style={{ width: "70%" }}>Gasto</th>
              <th style={{ width: "20%" }}>Monto (USD)</th>
              <th style={{ width: "10%" }}>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loadingList ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: 18 }}>
                  Cargando…
                </td>
              </tr>
            ) : gastos.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  style={{ textAlign: "center", padding: 18, color: "#6b7280" }}
                >
                  No hay gastos mensuales registrados.
                </td>
              </tr>
            ) : (
              gastos.map((g, idx) => {
                const id = g.id ?? g.idGastoFijo ?? g.Id ?? g.IdGastoFijo;
                const nombreG = g.nombre ?? g.Nombre ?? "-";
                const montoN = Number(g.monto ?? g.Monto ?? 0);
                return (
                  <tr key={id ?? idx}>
                    <td>{nombreG}</td>
                    <td>{moneyUSD(montoN)}</td>
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

          {/* Total mensual en el footer de la tabla */}
          {!loadingList && gastos.length > 0 && (
            <tfoot>
              <tr>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  Total mensual
                </td>
                <td style={{ fontWeight: 700 }}>{moneyUSD(total)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
