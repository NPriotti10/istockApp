import React, { useEffect, useMemo, useState } from "react";
import { getPurchasesPaged, deletePurchase } from "../services/purchases";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination"; // ⬅️ importar tu componente

export default function Purchase() {
  const [purchase, setPurchase] = useState([]);
  const [typed, setTyped] = useState(""); // input del buscador con debounce
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  // debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(typed);
    }, 300);
    return () => clearTimeout(t);
  }, [typed]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getPurchasesPaged({ page, pageSize, search });
      // Espera shape: { items, page, pageSize, totalPages, totalItems }
      if (Array.isArray(res)) {
        // fallback por si aún no tenés paginado en back (temporal)
        const start = (page - 1) * pageSize;
        setPurchase(res.slice(start, start + pageSize));
        setTotalItems(res.length);
      } else {
        setPurchase(res.items || []);
        setTotalItems(res.totalItems || 0);
      }
    } catch (e) {
      console.error("Error al obtener compras:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search]);

  const handleDelete = async (compraId) => {
    if (!confirm("¿Estás seguro de eliminar esta compra?")) return;
    try {
      await deletePurchase(compraId);
      // si borrás el último de la página, retrocede una
      if (purchase.length === 1 && page > 1) setPage(p => p - 1);
      else fetchData();
    } catch (e) {
      console.error("Error al eliminar compra:", e);
    }
  };

  const currency = (n) => (typeof n === "number" ? `$${n.toFixed(2)}` : "-");

  const pagInfo = useMemo(() => {
    const from = totalItems ? (page - 1) * pageSize + 1 : 0;
    const to = Math.min(page * pageSize, totalItems);
    return totalItems ? `${from}-${to} de ${totalItems}` : "0 de 0";
  }, [page, pageSize, totalItems]);

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

      {/* Barra superior: buscador + page size */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Buscar por proveedor..."
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", width: "100%", maxWidth: 360 }}
        />
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
            {[5, 10, 20, 50].map(s => <option key={s} value={s}>{s}</option>)}
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
            ) : purchase.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: 18 }}>Sin compras registradas</td></tr>
            ) : (
              purchase.map((compra, idx) => (
                <tr key={compra.idCompra || `${page}-${idx}`}>
                  
                  <td>{compra?.fecha ? new Date(compra.fecha).toLocaleDateString() : "-"}</td>
                  <td>{compra?.proveedor || "-"}</td>
                  <td>{currency(Number(compra?.precioTotal ?? 0))}</td>
                  
                  <td>
                    <Link to={`/compras/detalle/${compra.idCompra}`} className="action-btn">Ver detalle</Link>
                  </td>
                  <td>
                    <Link to={`/compras/editar/${compra.idCompra}`} className="action-btn edit">Editar</Link>
                    <button className="action-btn delete" onClick={() => handleDelete(compra.idVenta)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info + Pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        
        <Pagination
          page={page}
          pageSize={pageSize}
          total={totalItems}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
