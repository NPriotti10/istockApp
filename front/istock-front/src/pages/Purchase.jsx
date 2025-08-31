// src/pages/Purchase.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getPurchasesPaged, getAllPurchases, deletePurchase } from "../services/purchases";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination";
import { moneyUSD } from "../utils/format"; // 💰 separador de miles

export default function Purchase() {
  // modo normal (paginado por backend)
  const [purchases, setPurchases] = useState([]);
  // modo mes (lista completa para filtrar localmente)
  const [allPurchases, setAllPurchases] = useState([]);

  // filtros
  const [typed, setTyped] = useState("");      // input del buscador con debounce
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");      // 'YYYY-MM' (input type=month)
  const filterByMonth = Boolean(month);

  // paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [loading, setLoading] = useState(false);

  // Debounce 300ms para el buscador
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(typed.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [typed]);

  // Traer compras (modo normal: paginado en backend)
  const fetchPaged = async () => {
    setLoading(true);
    try {
      const res = await getPurchasesPaged({ page, pageSize, search });
      if (Array.isArray(res)) {
        // fallback si el back devolviera array
        const start = (page - 1) * pageSize;
        setPurchases(res.slice(start, start + pageSize));
        setTotalItems(res.length);
      } else {
        setPurchases(res.items || []);
        setTotalItems(res.totalItems || 0);
      }
    } catch (e) {
      console.error("Error al obtener compras:", e);
    } finally {
      setLoading(false);
    }
  };

  // Traer compras completas cuando cambia el mes (modo “mes”)
  useEffect(() => {
    if (!filterByMonth) return;
    setLoading(true);
    getAllPurchases()
      .then((data) => setAllPurchases(Array.isArray(data) ? data : []))
      .catch((e) => console.error("Error al obtener compras (all):", e))
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
  const { shownPurchases, shownTotal } = useMemo(() => {
    if (!filterByMonth) {
      return { shownPurchases: purchases, shownTotal: totalItems };
    }

    // rangos del mes
    const [y, m] = month.split("-").map(Number);
    const from = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const to = new Date(y, m, 0, 23, 59, 59, 999);

    // filtrar por fecha y por proveedor (search)
    const filtered = (allPurchases || []).filter((c) => {
      const fecha = c?.fecha ? new Date(c.fecha) : null;
      if (!fecha) return false;
      const inMonth = fecha >= from && fecha <= to;
      const matchesSearch = search
        ? String(c?.proveedor || "").toLowerCase().includes(search.toLowerCase())
        : true;
      return inMonth && matchesSearch;
    });

    // paginar localmente
    const start = (page - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);
    return { shownPurchases: pageItems, shownTotal: filtered.length };
  }, [filterByMonth, allPurchases, purchases, totalItems, month, page, pageSize, search]);

  const handleDelete = async (idCompra) => {
    if (!confirm("¿Estás seguro de eliminar esta compra?")) return;
    try {
      await deletePurchase(idCompra);
      if (filterByMonth) {
        // En modo mes, recargo todo y el filtrado se aplica solo
        const data = await getAllPurchases();
        setAllPurchases(Array.isArray(data) ? data : []);
      } else {
        // si borrás el último de la página, retrocede una
        if (shownPurchases.length === 1 && page > 1) setPage((p) => p - 1);
        else fetchPaged();
      }
    } catch (e) {
      console.error("Error al eliminar compra:", e);
    }
  };

  // Info + Pagination
  const pagInfo = useMemo(() => {
    const total = Number(shownTotal ?? 0);
    if (!total) return "0 de 0";
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return `${from}-${to} de ${total}`;
  }, [page, pageSize, shownTotal]);

  return (
    <div className="body-bg" style={{ padding: 24 }}>
      {/* Encabezado */}
      <div
        className="sales-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}
      >
        <h1 className="products-title">COMPRAS</h1>
        <Link to="/compras/nueva" className="add-product-btn">+ Nueva Compra</Link>
      </div>

      {/* Barra superior: buscador + mes + page size */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Buscar por proveedor..."
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", width: "100%", maxWidth: 280 }}
        />

        {/* Filtro por mes (YYYY-MM) */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
                border: "1px solid #ccc",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 600
              }}
              title="Quitar filtro de mes"
            >
              Limpiar mes
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

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Precio Total (USD)</th>
              <th>Detalle</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: 18 }}>Cargando...</td></tr>
            ) : shownPurchases.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: 18 }}>Sin compras registradas</td></tr>
            ) : (
              shownPurchases.map((compra, idx) => (
                <tr key={compra.idCompra || `${page}-${idx}`}>
                  <td>{compra?.fecha ? new Date(compra.fecha).toLocaleDateString() : "-"}</td>
                  <td>{compra?.proveedor || "-"}</td>
                  <td>{moneyUSD(Number(compra?.precioTotal ?? 0))}</td>

                  <td>
                    <Link to={`/compras/detalle/${compra.idCompra}`} className="action-btn">Ver detalle</Link>
                  </td>
                  <td>
                    <Link to={`/compras/editar/${compra.idCompra}`} className="action-btn edit">Editar</Link>
                    <button className="action-btn delete" onClick={() => handleDelete(compra.idCompra)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info + Pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <small style={{ color: "#6b7280" }}>{pagInfo}</small>
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
