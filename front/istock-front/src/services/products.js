import api from "./api";

export const getAllProducts = async () => {
  const res = await api.get("/productos"); // <- esta ruta debe coincidir con el backend
  return res.data;
};

export const nuevoProduct = async (nuevoProducto) => {
  const res = await api.post("/productos", nuevoProducto);
  return res.data;
};

export const deleteProduct = async (id) => {
  return await api.delete(`/productos/${id}`);
};

export const getProductById = async (id) => {
  const res = await api.get(`/productos/${id}`);
  return res.data;
};

export const updateProduct = async (id, data) => {
  return await api.put(`/productos/${id}`, data);
};

export async function getProductsPaged({ page = 1, pageSize = 10, search = "", categoriaId = null }) {
  const params = new URLSearchParams({ page, pageSize });
  if (search) params.append("search", search);
  if (categoriaId) params.append("categoriaId", categoriaId);

  const res = await fetch(`/api/productos?${params.toString()}`);
  if (!res.ok) throw new Error("Error al cargar productos");
  return res.json(); // { items, total, page, pageSize }
}