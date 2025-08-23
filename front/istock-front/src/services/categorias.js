// usa tu cliente axios con baseURL y JWT
import api from "./api";

// GET: /api/categorias (lista completa)
export async function getAllCategorias() {
  const { data } = await api.get("/categorias");
  return data; // [{ idCategoria, nombre }, ...]
}

// POST: /api/categorias
export async function createCategory(nombre) {
  const { data } = await api.post("/categorias", { nombre });
  return data; // { idCategoria, nombre }
}

// PUT: /api/categorias/{id}
export async function updateCategory(id, nombre) {
  // el controller valida que id == body.idCategoria
  await api.put(`/categorias/${id}`, { idCategoria: id, nombre });
}

// DELETE: /api/categorias/{id}
export async function deleteCategory(id) {
  await api.delete(`/categorias/${id}`);
}
