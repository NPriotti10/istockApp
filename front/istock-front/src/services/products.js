import api from "./api";

/** GET: /api/productos (paginado + filtros por querystring) */
export async function getProductsPaged({ page = 1, pageSize = 10, search = "", categoriaId = null }) {
  const params = { page, pageSize };
  if (search) params.search = search;
  if (categoriaId !== null && categoriaId !== undefined && categoriaId !== "") {
    params.categoriaId = Number(categoriaId);
  }
  const { data } = await api.get("/productos", { params });
  // Espera { items, total, page, pageSize }
  return data;
}

/** GET: /api/productos (todos – evita usarlo si ya usás paginado) */
export async function getAllProducts() {
  const { data } = await api.get("/productos");
  return data;
}

/** POST: /api/productos */
export async function createProduct(nuevoProducto) {
  const { data } = await api.post("/productos", nuevoProducto);
  return data;
}
// alias si querés mantener el nombre anterior:
export const nuevoProduct = createProduct;

/** DELETE: /api/productos/{id} */
export async function deleteProduct(id) {
  return api.delete(`/productos/${id}`);
}

/** GET: /api/productos/{id} */
export async function getProductById(id) {
  const { data } = await api.get(`/productos/${id}`);
  return data;
}

/** PUT: /api/productos/{id} */
export async function updateProduct(id, prod) {
  return api.put(`/productos/${id}`, prod);
}
