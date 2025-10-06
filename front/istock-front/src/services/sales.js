// src/services/sales.js
import api from "./api";

/**
 * NOTA:
 * - La baseURL en api.js ya termina en /api
 * - Por eso acá las rutas van SIN /api delante (ej: "/ventas/...")
 */

/** GET: /ventas/paged  (paginado + búsqueda opcional) */
export async function getSalesPaged({ page = 1, pageSize = 10, search = "" } = {}) {
  const params = { page, pageSize };
  if (search) params.search = search;
  const { data } = await api.get("/ventas/paged", { params });
  // Espera { items, totalItems, page, pageSize } (o un array como fallback)
  return data;
}

/** GET: /ventas  (todas las ventas) */
export async function getAllSales() {
  const { data } = await api.get("/ventas");
  return data;
}

/** GET: /ventas/{id} */
export async function getSaleById(id) {
  const { data } = await api.get(`/ventas/${id}`);
  return data;
}

/** POST: /ventas */
export async function createSale(saleData) {
  const { data } = await api.post("/ventas", saleData);
  return data;
}

/** PUT: /ventas/{id} */
export async function updateSale(id, updatedData) {
  const { data } = await api.put(`/ventas/${id}`, updatedData);
  return data;
}

/** DELETE: /ventas/{id} */
export async function deleteSale(id) {
  const { data } = await api.delete(`/ventas/${id}`);
  return data;
}

/**
 * GET: /ventas/estadisticas?year=YYYY&month=MM
 * Devuelve, entre otros campos:
 *  - totalVentasNoAccesoriosUSD (number)
 *  - totalVentasAccesoriosARS   (number)
 */
export async function getSalesStats({ year, month }) {
  const { data } = await api.get("/ventas/estadisticas", {
    params: { year, month },
  });
  return data;
}
