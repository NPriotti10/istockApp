// src/services/purchases.js
import api from "./api"; // <-- usa el cliente con baseURL y token

// Nota: Tu CompraController tiene [Route("api/[controller]")] y se llama "CompraController"
// Eso expone /api/compra (singular). Por eso acá usamos "/compra".
// Si lo cambias a plural en el back, reemplazá "/compra" por "/compras".

/** GET: /api/compra (paginado + búsqueda por proveedor) */


/** GET: /api/compra (todas) */
export async function getAllPurchases() {
  const { data } = await api.get("/compra");
  return data;
}

/** GET: /api/compra/{id} */
export async function getPurchaseById(id) {
  const { data } = await api.get(`/compra/${id}`);
  return data;
}

/** POST: /api/compra */
export async function createPurchase(purchaseData) {
  const { data } = await api.post("/compra", purchaseData);
  return data;
}

/** PUT: /api/compra/{id} */
export async function updatePurchase(id, updatedData) {
  const { data } = await api.put(`/compra/${id}`, updatedData);
  return data;
}

/** DELETE: /api/compra/{id} */
export async function deletePurchase(id) {
  const { data } = await api.delete(`/compra/${id}`);
  return data;
}

export async function getPurchasesPaged({ page = 1, pageSize = 10, search = "" } = {}) {
  const params = { page, pageSize };
  if (search) params.search = search;
  const { data } = await api.get("/compra/paged", { params });
  return data;
}
