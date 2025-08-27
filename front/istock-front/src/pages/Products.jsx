// src/pages/Products.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDolarValue } from "../services/dolar";
import { getAllCategorias } from "../services/categorias";
import { getProductsPaged, deleteProduct, getInventoryInvestment } from "../services/products";
import Pagination from "../components/Pagination";

const USD_OVERRIDE_KEY = "usd_override_v1";

export default function Products() {
  // Datos paginados
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);

  // Filtros
  const [typed, setTyped] = useState("");           // input del buscador (con debounce)
  const [searchTerm, setSearchTerm] = useState(""); // lo que viaja a la API
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categorias, setCategorias] = useState([]);

  // Dólar (mercado/override)
  const [dolar, setDolar] = useState(1);           // valor efectivo que usa la tabla
  const [nuevoDolar, setNuevoDolar] = useState(1); // input para actualizar
  const [isOverridden, setIsOverridden] = useState(false);
  const [updatingDolar, setUpdatingDolar] = useState(false);
  const [dolarError, setDolarError] = useState("");

  // Inversión total (costo * stock)
  const [inv, setInv] = useState({ totalCostoUSD: 0, totalCostoARS: 0 });

  // Utilidad moneda
  const currency = (n) =>
    typeof n === "number" && !Number.isNaN(n) ? `$${n.toFixed(2)}` : "-";

  // Helper: ¿es accesorio?
  const esAccesorio = (prod) =>
    (prod?.categoria?.nombre || "").trim().toLowerCase() === "accesorio" ||
    (prod?.categoria?.nombre || "").trim().toLowerCase() === "accesorios";

  // Cargar dólar y categorías una vez
  useEffect(() => {
    // 1) Intentar leer override local
    const raw = localStorage.getItem(USD_OVERRIDE_KEY);
    if (raw) {
      try {
        const { value } = JSON.parse(raw);
        const v = Number(value);
        if (v > 0) {
          setDolar(v);
          setNuevoDolar(v);
          setIsOverridden(true);
        }
      } catch { /* ignore */ }
    }

    // 2) Traer valor de mercado (si no hay override, o para reset)
    getDolarValue()
      .then((val) => {
        const v = Number(val) || 1;
        if (!raw) {
          setDolar(v);
          setNuevoDolar(v);
        }
      })
      .catch(() => { /* opcional: toast */ });

    getAllCategorias().then(setCategorias).catch(() => alert("Error al obtener categorías"));
  }, []);

  // Debounce buscador (300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setData((prev) => ({ ...prev, page: 1 })); // reset a página 1
      setSearchTerm(typed.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [typed]);

  // Cargar productos (paginado + filtros)
  async function load(page = 1, size = data.pageSize) {
    setLoading(true);
    try {
      const res = await getProductsPaged({
        page,
        pageSize: size,
        search: searchTerm,
        categoriaId: selectedCategory ? Number(selectedCategory) : null,
      });
      setData(res); // { items, total, page, pageSize }
    } catch (err) {
      console.error("Error al obtener productos:", err);
    } finally {
      setLoading(false);
    }
  }

  // Re-cargar al cambiar filtros o pageSize
  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory, data.pageSize]);

  // Traer inversión total cada vez que cambia el dólar efectivo
  useEffect(() => {
    const v = Number(dolar);
    if (!v || v <= 0) return;
    getInventoryInvestment(v)
      .then((res) => setInv(res || { totalCostoUSD: 0, totalCostoARS: 0 }))
      .catch(() => {
        // si falla, lo dejamos en 0 sin romper la UI
        setInv({ totalCostoUSD: 0, totalCostoARS: 0 });
      });
  }, [dolar]);

  // Eliminar y recargar la página actual
  async function handleDelete(idProducto) {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await deleteProduct(idProducto);
      const isLastItemOnPage = data.items.length === 1 && data.page > 1;
      load(isLastItemOnPage ? data.page - 1 : data.page);
      // refrescamos inversión tras eliminar
      const v = Number(dolar) || 1;
      getInventoryInvestment(v).then(setInv).catch(() => {});
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  }

  // Actualizar valor del dólar (override local)
  async function handleActualizarDolar(e) {
    e.preventDefault();
    setDolarError("");
    const val = Number(nuevoDolar);
    if (Number.isNaN(val) || val <= 0) {
      setDolarError("Ingresá un valor numérico mayor a 0.");
      return;
    }
    setUpdatingDolar(true);
    try {
      localStorage.setItem(USD_OVERRIDE_KEY, JSON.stringify({ value: val, updatedAt: new Date().toISOString() }));
      setDolar(val);
      setIsOverridden(true);
    } catch (err) {
      console.error("Error guardando override USD:", err);
      setDolarError("No se pudo guardar el valor local.");
    } finally {
      setUpdatingDolar(false);
    }
  }

  // Volver al valor de mercado
  async function handleResetDolar() {
    setDolarError("");
    try {
      const mercado = await getDolarValue();
      const v = Number(mercado) || 1;
      localStorage.removeItem(USD_OVERRIDE_KEY);
      setDolar(v);
      setNuevoDolar(v);
      setIsOverridden(false);
    } catch {
      setDolarError("No se pudo obtener el valor de mercado.");
    }
  }

  // Info de paginación estilo "x-y de total"
  const pagInfo = useMemo(() => {
    const total = Number(data.total ?? 0);
    if (!total) return "0 de 0";
    const from = (data.page - 1) * data.pageSize + 1;
    const to = Math.min(data.page * data.pageSize, total);
    return `${from}-${to} de ${total}`;
  }, [data.page, data.pageSize, data.total]);

  const usd = Number(dolar) || 1;

  return (
    <div className="body-bg" style={{ padding: 24 }}>
      {/* Dólar actual + actualizar (override local) */}
      <form
        onSubmit={handleActualizarDolar}
        style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}
      >
        <span style={{ fontSize: 14, color: "#555" }}>
          USD {isOverridden ? "(manual)" : "(mercado)"}:
        </span>
        <strong style={{ fontSize: 15 }}>${usd.toFixed(2)}</strong>

        <input
          type="number"
          step="0.01"
          min="0"
          value={nuevoDolar}
          onChange={(e) => setNuevoDolar(e.target.value)}
          style={{ padding: "8px", borderRadius: 6, border: "1px solid #ccc", width: 120 }}
          aria-label="Nuevo valor del dólar"
        />
        <button
          type="submit"
          disabled={updatingDolar}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "none",
            background: updatingDolar ? "#9CA3AF" : "#2563EB",
            color: "#fff",
            fontWeight: 600,
            cursor: updatingDolar ? "not-allowed" : "pointer"
          }}
          title="Actualizar valor del dólar"
        >
          {updatingDolar ? "Guardando..." : "Actualizar"}
        </button>

        <button
          type="button"
          onClick={handleResetDolar}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: "#fff",
            fontWeight: 600,
            cursor: "pointer"
          }}
          title="Volver al valor de mercado"
        >
          Usar mercado
        </button>

        {dolarError ? <span style={{ color: "#B91C1C", fontSize: 12 }}>{dolarError}</span> : null}
      </form>

      {/* Resumen de inversión */}
      <div style={{
        margin: "12px 0 16px",
        padding: 12,
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        background: "#f9fafb",
        display: "flex",
        gap: 16,
        flexWrap: "wrap"
      }}>
        <div><strong>Inversión total (USD):</strong> {currency(Number(inv.totalCostoUSD || 0))}</div>
        <div><strong>Inversión total (ARS):</strong> {currency(Number(inv.totalCostoARS || 0))}</div>
      </div>

      {/* Encabezado */}
      <div
        className="products-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}
      >
        <h1 className="products-title">PRODUCTOS</h1>
        <Link to="/productos/nuevo" className="add-product-btn">+ Nuevo Producto</Link>
      </div>

      {/* 🔍 Barra superior */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        {/* Buscador por nombre */}
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", width: "100%", maxWidth: 360 }}
        />

        {/* Filtro por categoría */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: "8px", borderRadius: 6, border: "1px solid #ccc", minWidth: 200 }}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat.idCategoria} value={cat.idCategoria}>
              {cat.nombre}
            </option>
          ))}
        </select>

        {/* Selector de filas por página */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#555" }}>Filas por página</span>
          <select
            value={data.pageSize}
            onChange={(e) => setData((prev) => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))}
            style={{ padding: "8px", borderRadius: 6, border: "1px solid #ccc", width: 80 }}
          >
            {[5, 10, 15, 25, 50].map((s) => (
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
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Precio Costo</th>
              <th>Precio Venta USD</th>
              <th>Precio Venta ARS</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 18 }}>Cargando…</td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 18 }}>Sin productos</td>
              </tr>
            ) : (
              data.items.map((prod, idx) => {
                const acc = esAccesorio(prod);
                const costo = Number(prod.precioCosto ?? 0);
                const venta = Number(prod.precioVenta ?? 0);

                // Regla: accesorios almacenan precios en ARS
                const ventaUSD = acc ? (venta / usd) : venta;
                const ventaARS = acc ? venta : (venta * usd);

                return (
                  <tr key={prod.idProducto ?? idx}>
                    <td>{prod.nombre}</td>
                    <td>{prod.descripcion}</td>
                    <td>{prod.categoria?.nombre}</td>
                    <td>{prod.stockActual}</td>

                    {/* Precio costo con sufijo de moneda */}
                    <td>
                      {currency(costo)}{" "}
                      <small style={{ color: "#6b7280" }}>{acc ? "ARS" : "USD"}</small>
                    </td>

                    {/* Ventas en USD/ARS respetando la regla de Accesorios */}
                    <td>{currency(ventaUSD)}</td>
                    <td>{currency(ventaARS)}</td>

                    <td>
                      <Link to={`/productos/editar/${prod.idProducto}`} className="action-btn edit">Editar</Link>
                      <button className="action-btn delete" onClick={() => handleDelete(prod.idProducto)}>Eliminar</button>
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
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={(p) => load(p)}
        />
      </div>
    </div>
  );
}
