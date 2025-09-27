// src/pages/Products.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDolarValue } from "../services/dolar";
import { getAllCategorias } from "../services/categorias";
import { getProductsPaged, deleteProduct, getInventoryInvestment } from "../services/products";
import Pagination from "../components/Pagination";
import { moneyUSD, moneyARS } from "../utils/format";

const USD_OVERRIDE_KEY = "usd_override_v1";

export default function Products() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);

  const [typed, setTyped] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categorias, setCategorias] = useState([]);

  const [dolar, setDolar] = useState(1);
  const [nuevoDolar, setNuevoDolar] = useState(1);
  const [isOverridden, setIsOverridden] = useState(false);
  const [updatingDolar, setUpdatingDolar] = useState(false);
  const [dolarError, setDolarError] = useState("");

  const [inv, setInv] = useState({ totalCostoUSD: 0, totalCostoARS: 0 });

  const esAccesorio = (prod) => {
    const n = (prod?.categoria?.nombre || "").trim().toLowerCase();
    return n === "accesorio" || n === "accesorios";
  };

  useEffect(() => {
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
      } catch {}
    }

    getDolarValue()
      .then((val) => {
        const v = Number(val) || 1;
        if (!raw) {
          setDolar(v);
          setNuevoDolar(v);
        }
      })
      .catch(() => {});
    getAllCategorias().then(setCategorias).catch(() => alert("Error al obtener categorías"));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setData((prev) => ({ ...prev, page: 1 }));
      setSearchTerm(typed.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [typed]);

  async function load(page = 1, size = data.pageSize) {
    setLoading(true);
    try {
      const res = await getProductsPaged({
        page,
        pageSize: size,
        search: searchTerm,
        categoriaId: selectedCategory ? Number(selectedCategory) : null,
      });
      setData(res);
    } catch (err) {
      console.error("Error al obtener productos:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory, data.pageSize]);

  useEffect(() => {
    const v = Number(dolar);
    if (!v || v <= 0) return;
    getInventoryInvestment(v)
      .then((res) => setInv(res || { totalCostoUSD: 0, totalCostoARS: 0 }))
      .catch(() => setInv({ totalCostoUSD: 0, totalCostoARS: 0 }));
  }, [dolar]);

  async function handleDelete(idProducto) {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await deleteProduct(idProducto);
      const isLastItemOnPage = data.items.length === 1 && data.page > 1;
      load(isLastItemOnPage ? data.page - 1 : data.page);
      const v = Number(dolar) || 1;
      getInventoryInvestment(v).then(setInv).catch(() => {});
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  }

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

  const pagInfo = useMemo(() => {
    const total = Number(data.total ?? 0);
    if (!total) return "0 de 0";
    const from = (data.page - 1) * data.pageSize + 1;
    const to = Math.min(data.page * data.pageSize, total);
    return `${from}-${to} de ${total}`;
  }, [data.page, data.pageSize, data.total]);

  const usd = Number(dolar) || 1;

  return (
    <div className="body-bg">
      <div className="page-wrap">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">PRODUCTOS</h1>
            <div className="page-sub">Listado, filtros y gestión del inventario</div>
          </div>
          <Link to="/productos/nuevo" className="btn-primary">＋ Nuevo producto</Link>
        </div>

        {/* Bloque: USD + Inversión */}
        <div className="row mb-12">
          <form onSubmit={handleActualizarDolar} className="card card--soft card-pad row" style={{flex: 1}}>
            <div className="page-note">USD <span>{isOverridden ? "(manual)" : "(mercado)"}</span></div>
            <strong>${usd.toFixed(2)}</strong>

            <input
              type="number"
              step="0.01"
              min="0"
              value={nuevoDolar}
              onChange={(e) => setNuevoDolar(e.target.value)}
              className="input input--sm"
              aria-label="Nuevo valor del dólar"
            />
            <button type="submit" disabled={updatingDolar} className="btn-primary">
              {updatingDolar ? "Guardando…" : "Actualizar"}
            </button>
            <button type="button" onClick={handleResetDolar} className="btn-outline">Usar mercado</button>
            {dolarError && <span className="page-note" style={{color:"#b91c1c"}}>{dolarError}</span>}
          </form>

          <div className="card card-pad stat" style={{minWidth: 260}}>
            <div className="stat__row">
              <div className="stat__label">Inversión total (USD)</div>
              <div className="stat__value">{moneyUSD(Number(inv.totalCostoUSD || 0))}</div>
            </div>
            <div className="stat__row">
              <div className="stat__label">Inversión total (ARS)</div>
              <div className="stat__value">{moneyARS(Number(inv.totalCostoARS || 0))}</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="card card-pad row mb-12">
          <input
            type="text"
            placeholder="Buscar por nombre…"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="input input--max360"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="select"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.idCategoria} value={cat.idCategoria}>{cat.nombre}</option>
            ))}
          </select>

          <div className="row" style={{marginLeft: "auto"}}>
            <span className="page-note">Filas</span>
            <select
              value={data.pageSize}
              onChange={(e) => setData((prev) => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))}
              className="select select--sm" style={{width: 80}}
            >
              {[5,10,15,25,50].map((s)=> <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="products-table-container table-wrap sticky">
          <table className="products-table table">
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
                <tr><td colSpan={8} style={{textAlign:"center", padding:18}}>Cargando…</td></tr>
              ) : data.items.length === 0 ? (
                <tr><td colSpan={8} style={{textAlign:"center", padding:18}}>Sin productos</td></tr>
              ) : (
                data.items.map((prod, idx)=> {
                  const acc = esAccesorio(prod);
                  const costo = Number(prod.precioCosto ?? 0);
                  const venta = Number(prod.precioVenta ?? 0);
                  const ventaUSDNum = acc ? (venta / usd) : venta;
                  const ventaARSNum = acc ? venta : (venta * usd);

                  return (
                    <tr key={prod.idProducto ?? idx} className="hover">
                      <td className="td-nowrap"><strong>{prod.nombre}</strong></td>
                      <td className="td-truncate">{prod.descripcion}</td>
                      <td>
                        <span className="chip">{prod.categoria?.nombre ?? "—"}</span>
                      </td>
                      <td className="td-num">{prod.stockActual}</td>
                      <td className="td-nowrap">{acc ? moneyARS(costo) : moneyUSD(costo)}</td>
                      <td className="td-nowrap">{moneyUSD(ventaUSDNum)}</td>
                      <td className="td-nowrap">{moneyARS(ventaARSNum)}</td>
                      <td>
                        <div className="row">
                          <Link to={`/productos/editar/${prod.idProducto}`} className="action-btn edit">Editar</Link>
                          <button className="action-btn delete" onClick={() => handleDelete(prod.idProducto)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="row row--split mt-16">
          
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={(p) => load(p)}
          />
        </div>
      </div>
    </div>
  );
}
