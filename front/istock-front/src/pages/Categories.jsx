// src/pages/Categories.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getAllCategorias,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/categorias";
import Pagination from "../components/Pagination";

export default function Categories() {
  // Data
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Alta rápida
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Edición inline
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Filtros + paginación local (mismo patrón que Compras)
  const [typed, setTyped] = useState(""); // input con debounce
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function load() {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await getAllCategorias();
      setCats(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setErrorMsg("No se pudieron cargar las categorías.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Debounce buscador
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(typed.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [typed]);

  // Filtrado + orden + paginación local
  const { shownCats, shownTotal } = useMemo(() => {
    const filtered = (cats || [])
      .filter(c =>
        search
          ? String(c?.nombre || "").toLowerCase().includes(search.toLowerCase())
          : true
      )
      .sort((a, b) => (a?.nombre || "").localeCompare(b?.nombre || ""));
    const start = (page - 1) * pageSize;
    return {
      shownCats: filtered.slice(start, start + pageSize),
      shownTotal: filtered.length,
    };
  }, [cats, search, page, pageSize]);

  const pagInfo = useMemo(() => {
    const total = Number(shownTotal ?? 0);
    if (!total) return "0 de 0";
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return `${from}-${to} de ${total}`;
  }, [page, pageSize, shownTotal]);

  // Alta
  async function handleCreate(e) {
    e.preventDefault();
    const nombre = newName.trim();
    if (!nombre) return;

    // evitar duplicados (case-insensitive)
    const exists = cats.some(
      (c) => String(c?.nombre || "").trim().toLowerCase() === nombre.toLowerCase()
    );
    if (exists) {
      alert("Ya existe una categoría con ese nombre.");
      return;
    }

    try {
      setCreating(true);
      const created = await createCategory(nombre);
      setCats((prev) => [created, ...prev]);
      setNewName("");
      setPage(1);
    } catch (e) {
      console.error(e);
      alert("No se pudo crear la categoría");
    } finally {
      setCreating(false);
    }
  }

  // Edición
  function startEdit(cat) {
    setEditId(cat.idCategoria);
    setEditName(cat.nombre || "");
  }
  function cancelEdit() {
    setEditId(null);
    setEditName("");
  }
  async function saveEdit() {
    const nombre = editName.trim();
    if (!nombre) return;

    const exists = cats.some(
      (c) =>
        c.idCategoria !== editId &&
        String(c?.nombre || "").trim().toLowerCase() === nombre.toLowerCase()
    );
    if (exists) {
      alert("Ya existe una categoría con ese nombre.");
      return;
    }

    try {
      setSavingId(editId);
      await updateCategory(editId, nombre);
      setCats((prev) =>
        prev.map((c) => (c.idCategoria === editId ? { ...c, nombre } : c))
      );
      cancelEdit();
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar la categoría");
    } finally {
      setSavingId(null);
    }
  }
  const onEditKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  // Eliminar
  async function handleDelete(id) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
      setDeletingId(id);
      await deleteCategory(id);
      setCats((prev) => prev.filter((c) => c.idCategoria !== id));

      // si la página quedó vacía, retroceder una
      const nextTotal = shownTotal - 1;
      const firstIdx = (page - 1) * pageSize;
      if (nextTotal <= firstIdx && page > 1) setPage((p) => p - 1);
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar la categoría");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="body-bg">
      <div className="page-wrap">
        {/* Header igual al de Compras */}
        <div className="page-header">
          <div>
            <h1 className="page-title">CATEGORÍAS</h1>
            <div className="page-sub">Alta rápida, búsqueda, edición y acciones</div>
          </div>

          {/* Alta rápida en header (armónico con tu patrón de CTA a la derecha) */}
          <form onSubmit={handleCreate} className="row" style={{ gap: 8 }}>
            <input
              type="text"
              placeholder="Nueva categoría…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input input--max360"
              aria-label="Nombre de nueva categoría"
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={creating || !newName.trim()}
              title="Agregar categoría"
            >
              {creating ? "Agregando…" : "＋ Agregar"}
            </button>
          </form>
        </div>

        {/* Barra superior: buscador + page size (en card como Compras) */}
        <div className="card card-pad row mb-12">
          <input
            type="text"
            placeholder="Buscar por nombre…"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="input input--max360"
            aria-label="Buscar categoría"
          />

          <div className="row" style={{ marginLeft: "auto" }}>
            <span className="page-note">Filas</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
              className="select select--sm"
              style={{ width: 80 }}
              aria-label="Filas por página"
            >
              {[5, 10, 20, 50].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mensaje de error consistente */}
        {errorMsg && (
          <div
            className="card card-pad"
            style={{
              background: "#FEF2F2",
              color: "#991B1B",
              border: "1px solid #FECACA",
              marginBottom: 12,
              borderRadius: 12,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Tabla (mismo contenedor y clases que Compras) */}
        <div className="products-table-container table-wrap sticky">
          <table className="products-table table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th style={{ width: 220 }}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={2} style={{ textAlign: "center", padding: 18 }}>Cargando…</td>
                </tr>
              ) : shownCats.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ textAlign: "center", padding: 18 }}>
                    Sin categorías
                  </td>
                </tr>
              ) : (
                shownCats.map((cat) => {
                  const isEditing = editId === cat.idCategoria;
                  const isDeleting = deletingId === cat.idCategoria;
                  const isSaving = savingId === cat.idCategoria;

                  return (
                    <tr key={cat.idCategoria}>
                      <td className="td-truncate">
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={onEditKeyDown}
                            className="input"
                            placeholder="Nombre de categoría"
                            aria-label="Editar nombre de categoría"
                            style={{ maxWidth: 420, width: "100%" }}
                          />
                        ) : (
                          cat.nombre
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="row">
                            <button
                              onClick={saveEdit}
                              className="action-btn edit"
                              style={{ marginRight: 8 }}
                              disabled={isSaving || !editName.trim()}
                              title="Guardar"
                            >
                              {isSaving ? "Guardando…" : "Guardar"}
                            </button>
                            <button onClick={cancelEdit} className="action-btn" title="Cancelar">
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="row">
                            <button
                              onClick={() => startEdit(cat)}
                              className="action-btn edit"
                              style={{ marginRight: 8 }}
                              title="Editar"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(cat.idCategoria)}
                              className="action-btn delete"
                              disabled={isDeleting}
                              title="Eliminar"
                            >
                              {isDeleting ? "Eliminando…" : "Eliminar"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: info + paginación (igual que Compras/Ventas) */}
        <div className="row row--split mt-16">
          <span className="page-info">{pagInfo}</span>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={shownTotal}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>
    </div>
  );
}
