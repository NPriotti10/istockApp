// src/pages/AddProduct.jsx
import React, { useState, useEffect, useMemo } from "react";
import { nuevoProduct } from "../services/products";
import { getAllCategorias } from "../services/categorias";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

export default function AddProduct() {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precioCosto: "",
    precioVenta: "",
    stockActual: "",
    stockMinimo: "",
    idCategoria: "",
    codigoBarra: "",
  });

  const [categorias, setCategorias] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // preselección por query (?categoria=3)
  useEffect(() => {
    const categoriaPredefinida = searchParams.get("categoria");
    if (categoriaPredefinida) {
      setForm((f) => ({ ...f, idCategoria: Number(categoriaPredefinida) || "" }));
    }
  }, [searchParams]);

  useEffect(() => {
    getAllCategorias().then(setCategorias).catch(() => {
      alert("Error al obtener categorías");
    });
  }, []);

  // ¿La categoría seleccionada es "Usado/Usados"?
  const esUsados = useMemo(() => {
    const cat = categorias.find((c) => Number(c.idCategoria) === Number(form.idCategoria));
    const nombre = (cat?.nombre || "").trim().toLowerCase();
    return nombre === "usados" || nombre === "usado";
  }, [categorias, form.idCategoria]);

  // Si es "Usados", fijar automáticamente: stockMinimo=0 y stockActual=1
  useEffect(() => {
    if (esUsados) {
      setForm((f) => ({ ...f, stockMinimo: 0, stockActual: 1 }));
    }
  }, [esUsados]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ["precioCosto", "precioVenta", "stockActual", "stockMinimo", "idCategoria"];
    setForm((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre?.trim()) return alert("El nombre es obligatorio.");
    if (!form.idCategoria) return alert("Seleccioná una categoría.");
    if (form.precioVenta === "" || isNaN(Number(form.precioVenta))) return alert("Precio de venta inválido.");
    if (form.precioCosto === "" || isNaN(Number(form.precioCosto))) return alert("Precio de costo inválido.");

    // Validaciones de stock según categoría
    if (esUsados) {
      // forzamos 1 y 0
      if (Number(form.stockActual ?? 0) !== 1) {
        setForm((f) => ({ ...f, stockActual: 1 }));
      }
      if (Number(form.stockMinimo ?? 0) !== 0) {
        setForm((f) => ({ ...f, stockMinimo: 0 }));
      }
    } else {
      if (form.stockActual === "" || isNaN(Number(form.stockActual))) return alert("Stock actual inválido.");
      if (form.stockMinimo === "" || isNaN(Number(form.stockMinimo))) return alert("Stock mínimo inválido.");
    }

    try {
      await nuevoProduct({
        ...form,
        idCategoria: Number(form.idCategoria),
        // valores finales asegurados
        stockActual: esUsados ? 1 : Number(form.stockActual || 0),
        stockMinimo: esUsados ? 0 : Number(form.stockMinimo || 0),
      });

      const params = new URLSearchParams(location.search);
      const volver = params.get("redirectTo");
      if (volver) {
        navigate(`${volver}?equipoPartePago=${encodeURIComponent(form.nombre)}`);
      } else {
        navigate("/productos");
      }
    } catch (err) {
      console.error("Error al agregar producto:", err);
      if (err?.response?.status === 409) {
        alert("Ya existe un producto con ese código de barras.");
      } else {
        alert("Ocurrió un error al guardar el producto.");
      }
    }
  };

  const input = { padding: 8, border: "1px solid #ccc", borderRadius: 6 };
  const label = { display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 };

  return (
    <div style={{ padding: 24 }}>
      <form onSubmit={handleSubmit} className="form-container" style={{ maxWidth: 560 }}>
        <h2>Nuevo Producto</h2>

        <label style={label}>
          Nombre:
          <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required style={input} />
        </label>

        <label style={label}>
          Descripción:
          <input type="text" name="descripcion" value={form.descripcion} onChange={handleChange} style={input} />
        </label>

        <label style={label}>
          Código de barras (opcional):
          <input
            type="text"
            name="codigoBarra"
            value={form.codigoBarra}
            onChange={handleChange}
            placeholder="Escaneá o escribí el código…"
            style={input}
          />
        </label>

        <label style={label}>
          Precio Costo:
          <input type="number" name="precioCosto" value={form.precioCosto} onChange={handleChange} required style={input} />
        </label>

        <label style={label}>
          Precio Venta:
          <input type="number" name="precioVenta" value={form.precioVenta} onChange={handleChange} required style={input} />
        </label>

        {/* ✅ CORREGIDO: name="stockActual" y valor fijo 1 si es Usados */}
        <label style={label}>
          Stock Actual {esUsados && <small style={{ color: "#2563eb" }}>(Usados fija 1)</small>}
          <input
            type="number"
            name="stockActual"
            value={esUsados ? 1 : form.stockActual}
            onChange={handleChange}
            required
            disabled={esUsados}
            style={{ ...input, background: esUsados ? "#f3f4f6" : "#fff" }}
          />
        </label>

        <label style={label}>
          Stock Mínimo {esUsados && <small style={{ color: "#2563eb" }}>(Usados fija 0)</small>}
          <input
            type="number"
            name="stockMinimo"
            value={esUsados ? 0 : form.stockMinimo}
            onChange={handleChange}
            required={!esUsados}
            disabled={esUsados}
            style={{ ...input, background: esUsados ? "#f3f4f6" : "#fff" }}
          />
        </label>

        <label style={label}>
          Categoría:
          <select
            name="idCategoria"
            value={form.idCategoria}
            onChange={handleChange}
            required
            style={{ ...input, height: 38 }}
          >
            <option value="">Seleccione una categoría</option>
            {categorias.map((cat) => (
              <option key={cat.idCategoria} value={cat.idCategoria}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" style={{ padding: "10px 14px" }}>Guardar</button>
      </form>
    </div>
  );
}
