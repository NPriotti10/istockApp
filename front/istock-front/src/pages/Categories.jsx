// src/pages/Categories.jsx
import React, { useEffect, useState } from "react";
import { getAllCategorias, createCategory, updateCategory, deleteCategory } from "../services/categorias";

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Alta
  const [newName, setNewName] = useState("");

  // Edición inline
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  async function load() {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await getAllCategorias();
      setCats(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setErrorMsg("No se pudieron cargar las categorías");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Crear
  async function handleCreate(e) {
    e.preventDefault();
    const nombre = newName.trim();
    if (!nombre) return;
    try {
      const created = await createCategory(nombre);
      setCats(prev => [created, ...prev]);
      setNewName("");
    } catch (e) {
      console.error(e);
      alert("No se pudo crear la categoría");
    }
  }

  // Editar
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
    try {
      await updateCategory(editId, nombre);
      setCats(prev => prev.map(c => (c.idCategoria === editId ? { ...c, nombre } : c)));
      cancelEdit();
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar la categoría");
    }
  }

  // Eliminar
  async function handleDelete(id) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
      await deleteCategory(id);
      setCats(prev => prev.filter(c => c.idCategoria !== id));
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar la categoría");
    }
  }

  // Estilos mínimos (compatibles con tu look & feel)
  const styles = {
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    addWrap: { display: "flex", gap: 8, alignItems: "center" },
    input: { padding: 8, borderRadius: 6, border: "1px solid #ccc" },
  };

  return (
    <div className="body-bg" style={{ padding: 24 }}>
      {/* Encabezado */}
      <div className="products-header" style={styles.header}>
        <h1 className="products-title">CATEGORÍAS</h1>

        {/* Alta rápida */}
        <form onSubmit={handleCreate} style={styles.addWrap}>
          <input
            type="text"
            placeholder="Nueva categoría..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ ...styles.input, width: 220 }}
          />
          <button type="submit" className="add-product-btn">+ Agregar</button>
        </form>
      </div>

      {errorMsg && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 8, marginBottom: 12 }}>
          {errorMsg}
        </div>
      )}

      {/* Tabla simple sin filtros ni paginación */}
      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th style={{ width: 120 }}>ID</th>
              <th>Nombre</th>
              <th style={{ width: 220 }}>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan={3} style={{ textAlign: "center", padding: 18 }}>Cargando…</td></tr>
            ) : cats.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: "center", padding: 18 }}>Sin categorías</td></tr>
            ) : (
              cats.map((cat) => (
                <tr key={cat.idCategoria}>
                  <td>{cat.idCategoria}</td>
                  <td>
                    {editId === cat.idCategoria ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={styles.input}
                      />
                    ) : (
                      cat.nombre
                    )}
                  </td>
                  <td>
                    {editId === cat.idCategoria ? (
                      <>
                        <button onClick={saveEdit} className="action-btn edit" style={{ marginRight: 8 }}>Guardar</button>
                        <button onClick={cancelEdit} className="action-btn">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(cat)} className="action-btn edit" style={{ marginRight: 8 }}>Editar</button>
                        <button onClick={() => handleDelete(cat.idCategoria)} className="action-btn delete">Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
