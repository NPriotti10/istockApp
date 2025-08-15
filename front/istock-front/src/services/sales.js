// src/services/sales.js
import api from "./api";

// NOTA: tu baseURL en api.js ya termina en /api,
// por eso acá las rutas van SIN /api delante (" /ventas ").

/** GET: /api/ventas (paginado + búsqueda opcional) */
export async function getSalesPaged({ page = 1, pageSize = 10, search = "" } = {}) {
  const params = { page, pageSize };
  if (search) params.search = search;
  const { data } = await api.get("/ventas/paged", { params });
  // Espera { items, total, page, pageSize } si tu back lo implementa
  return data;
}

/** GET: /api/ventas (todas) */
export async function getAllSales() {
  const { data } = await api.get("/ventas");
  return data;
}

/** GET: /api/ventas/{id} */
export async function getSaleById(id) {
  const { data } = await api.get(`/ventas/${id}`);
  return data;
}

/** POST: /api/ventas */
export async function createSale(saleData) {
  const { data } = await api.post("/ventas", saleData);
  return data;
}

/** PUT: /api/ventas/{id} */
export async function updateSale(id, updatedData) {
  const { data } = await api.put(`/ventas/${id}`, updatedData);
  return data;
}

/** DELETE: /api/ventas/{id} */
export async function deleteSale(id) {
  const { data } = await api.delete(`/ventas/${id}`);
  return data;
}
