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
