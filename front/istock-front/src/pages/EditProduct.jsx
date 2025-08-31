// src/pages/EditProduct.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById, updateProduct } from "../services/products";
import { getAllCategorias } from "../services/categorias";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

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

  // helper: detectar si la categoría seleccionada es "usado(s)"
  const isUsadoById = (catId) => {
    const cat = categorias.find(
      (c) => Number(c.idCategoria) === Number(catId)
    );
    if (!cat) return false;
    const n = (cat.nombre || "").trim().toLowerCase();
    return n === "usado" || n === "usados";
  };

  const isUsado = useMemo(
    () => isUsadoById(form.idCategoria),
    [form.idCategoria, categorias]
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [prod, cats] = await Promise.all([
          getProductById(id),
          getAllCategorias(),
        ]);
        if (!mounted) return;

        setCategorias(cats || []);

        setForm({
          nombre: prod?.nombre ?? "",
          descripcion: prod?.descripcion ?? "",
          precioCosto: prod?.precioCosto ?? 0,
          precioVenta: prod?.precioVenta ?? 0,
          stockActual: prod?.stockActual ?? 0,
          stockMinimo: prod?.stockMinimo ?? 0,
          idCategoria: prod?.idCategoria ?? "",
          codigoBarra: prod?.codigoBarra ?? "",
        });
      } catch (e) {
        console.error(e);
        setErr("No se pudo cargar el producto.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Si la categoría es "usado(s)", forzar stockMinimo=0 y stockActual=1
  useEffect(() => {
    if (!categorias.length) return;
    if (isUsado) {
      setForm((prev) => ({
        ...prev,
        stockMinimo: 0,
        stockActual: 1,
      }));
    }
  }, [isUsado, categorias]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = [
      "precioCosto",
      "precioVenta",
      "stockActual",
      "stockMinimo",
      "idCategoria",
    ];

    if (numericFields.includes(name)) {
      setForm((prev) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSaving(true);

    try {
      const payload = {
        ...form,
        precioCosto: Number(form.precioCosto),
        precioVenta: Number(form.precioVenta),
        stockActual: Number(form.stockActual),
        stockMinimo: Number(form.stockMinimo),
        idCategoria: Number(form.idCategoria),
        codigoBarra: String(form.codigoBarra || "").trim(),
      };

      await updateProduct(id, payload);
      alert("✅ Producto actualizado correctamente");
      navigate("/productos");
    } catch (e) {
      console.error(e);
      setErr("No se pudo actualizar el producto.");
    } finally {
      setSaving(false);
    }
  };

  // ====== estilos ======
  const styles = {
    wrap: { padding: 24, display: "grid", placeItems: "center" },
    card: {
      width: "100%",
      maxWidth: 720,
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      boxShadow: "0 6px 18px rgba(0,0,0,.06)",
      padding: 20,
    },
    title: { margin: "6px 0 4px", fontSize: 22, fontWeight: 800 },
    hint: { marginBottom: 12, color: "#64748b", fontSize: 13 },
    grid: {
      display: "grid",
      gap: 12,
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    group: { display: "flex", flexDirection: "column", gap: 6 },
    label: { fontSize: 13, fontWeight: 700, color: "#374151" },
    input: {
      padding: "10px 12px",
      borderRadius: 8,
      border: "1px solid #d1d5db",
      outline: "none",
      fontSize: 14,
    },
    full: { gridColumn: "1 / -1" },
    note: { fontSize: 12, color: "#6b7280" },
    actions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 14,
    },
    btn: {
      padding: "10px 14px",
      border: 0,
      borderRadius: 10,
      cursor: "pointer",
      fontWeight: 700,
    },
    btnGhost: {
      background: "transparent",
      color: "#374151",
      border: "1px solid #d1d5db",
    },
    btnPrimary: { background: "#2563eb", color: "#fff" },
    error: { color: "#dc2626", marginBottom: 8, fontSize: 14 },
  };

  if (loading) return <div style={{ padding: 24 }}>Cargando…</div>;

  return (
    <div style={styles.wrap}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>Editar producto</h2>
        <div style={styles.hint}>
          {isUsado
            ? "Categoría USADO: el stock es único (1) y el mínimo queda en 0."
            : "Completá los datos del producto y guardá los cambios."}
        </div>

        {err && <div style={styles.error}>{err}</div>}

        <div style={styles.grid}>
          {/* Nombre */}
          <div style={styles.group}>
            <label style={styles.label}>Nombre</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          {/* Código de barras */}
          <div style={styles.group}>
            <label style={styles.label}>Código de barras</label>
            <input
              name="codigoBarra"
              value={form.codigoBarra}
              onChange={handleChange}
              style={styles.input}
              placeholder="Escaneá o escribí el código"
            />
          </div>

          {/* Descripción */}
          <div style={{ ...styles.group, ...styles.full }}>
            <label style={styles.label}>Descripción</label>
            <input
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          {/* Precio costo */}
          <div style={styles.group}>
            <label style={styles.label}>Precio costo (USD)</label>
            <input
              type="number"
              name="precioCosto"
              value={form.precioCosto}
              onChange={handleChange}
              style={styles.input}
              step="0.01"
              required
            />
          </div>

          {/* Precio venta */}
          <div style={styles.group}>
            <label style={styles.label}>Precio venta (USD)</label>
            <input
              type="number"
              name="precioVenta"
              value={form.precioVenta}
              onChange={handleChange}
              style={styles.input}
              step="0.01"
              required
            />
          </div>

          {/* Stock actual */}
          <div style={styles.group}>
            <label style={styles.label}>
              Stock actual {isUsado && <span style={styles.note}>(fijado en 1)</span>}
            </label>
            <input
              type="number"
              name="stockActual"
              value={form.stockActual}
              onChange={handleChange}
              style={styles.input}
              min="0"
              required
              disabled={isUsado}
            />
          </div>

          {/* Stock mínimo */}
          <div style={styles.group}>
            <label style={styles.label}>
              Stock mínimo {isUsado && <span style={styles.note}>(fijado en 0)</span>}
            </label>
            <input
              type="number"
              name="stockMinimo"
              value={form.stockMinimo}
              onChange={handleChange}
              style={styles.input}
              min="0"
              required
              disabled={isUsado}
            />
          </div>

          {/* Categoría */}
          <div style={{ ...styles.group, ...styles.full }}>
            <label style={styles.label}>Categoría</label>
            <select
              name="idCategoria"
              value={form.idCategoria}
              onChange={handleChange}
              style={styles.input}
              required
            >
              <option value="">Seleccionar…</option>
              {categorias.map((c) => (
                <option key={c.idCategoria} value={c.idCategoria}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Acciones */}
        <div style={styles.actions}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{ ...styles.btn, ...styles.btnGhost }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{ ...styles.btn, ...styles.btnPrimary }}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
