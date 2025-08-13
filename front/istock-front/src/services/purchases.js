// src/services/purchases.js
import axios from "axios";

const API_URL = "http://localhost:7063/api/compra"; // Ajustalo si tu endpoint es distinto

export const getAllPurchases = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const getPurchaseById = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};

export const createPurchase = async (saleData) => {
  const res = await axios.post(API_URL, saleData);
  return res.data;
};

export const updatePurchase = async (id, updatedData) => {
  const res = await axios.put(`${API_URL}/${id}`, updatedData);
  return res.data;
};

export const deletePurchase = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};

// services/purchase.js
export async function getPurchasesPaged({ page = 1, pageSize = 10, search = "" } = {}) {
  const params = new URLSearchParams({ page, pageSize, search });
  const res = await fetch(`/api/compra/paged?${params.toString()}`);
  if (!res.ok) throw new Error("Error al obtener compras paginadas");
  return res.json();
}
