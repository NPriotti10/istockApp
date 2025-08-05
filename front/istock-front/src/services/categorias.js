import api from "./api";

export const getAllCategorias = async () => {
  const res = await api.get("/categorias");
  return res.data;
};
