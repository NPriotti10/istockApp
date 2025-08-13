import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDolarValue } from "../services/dolar";
import { getAllCategorias } from "../services/categorias";
import { getProductsPaged, deleteProduct } from "../services/products";
import Pagination from "../components/Pagination";

export default function Products() {
  // Datos paginados
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);

  // Filtros
  const [typed, setTyped] = useState("");          // input del buscador (con debounce)
  const [searchTerm, setSearchTerm] = useState(""); // lo que viaja a la API
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categorias, setCategorias] = useState([]);

  // Dólar
  const [dolar, setDolar] = useState(1);

  // Utilidad moneda
  const currency = (n) =>
    typeof n === "number" && !Number.isNaN(n) ? `$${n.toFixed(2)}` : "-";

  // Cargar dólar y categorías una vez
  useEffect(() => {
    getDolarValue().then(setDolar).catch(() => {});
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
      // res: { items, total, page, pageSize }
      setData(res);
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

  // Eliminar y recargar la página actual
  async function handleDelete(idProducto) {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await deleteProduct(idProducto);
      const isLastItemOnPage = data.items.length === 1 && data.page > 1;
      load(isLastItemOnPage ? data.page - 1 : data.page);
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  }

  // Info de paginación estilo compras: "x-y de total"
  const pagInfo = useMemo(() => {
    const total = Number(data.total ?? 0);
    if (!total) return "0 de 0";
    const from = (data.page - 1) * data.pageSize + 1;
    const to = Math.min(data.page * data.pageSize, total);
    return `${from}-${to} de ${total}`;
  }, [data.page, data.pageSize, data.total]);

  return (
    <div className="body-bg" style={{ padding: 24 }}>
      {/* Encabezado */}
      <div
        className="products-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}
      >
        <h1 className="products-title">PRODUCTOS</h1>
        <Link to="/productos/nuevo" className="add-product-btn">+ Nuevo Producto</Link>
      </div>

      {/* 🔍 Barra superior con mismo estilo que Compras */}
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

        {/* Selector de filas por página alineado a la derecha (igual a Compras) */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
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
              data.items.map((prod, idx) => (
                <tr key={prod.idProducto ?? idx}>
                  <td>{prod.nombre}</td>
                  <td>{prod.descripcion}</td>
                  <td>{prod.categoria?.nombre}</td>
                  <td>{prod.stockActual}</td>
                  <td>{currency(Number(prod.precioCosto ?? 0))}</td>
                  <td>{currency(Number(prod.precioVenta ?? 0))}</td>
                  <td>{currency(Math.round(Number(prod.precioVenta ?? 0) * Number(dolar ?? 1)))}</td>
                  <td>
                    <Link to={`/productos/editar/${prod.idProducto}`} className="action-btn edit">Editar</Link>
                    <button className="action-btn delete" onClick={() => handleDelete(prod.idProducto)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info + Paginación (igual a Compras) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, color: "#555" }}>{pagInfo}</span>
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
