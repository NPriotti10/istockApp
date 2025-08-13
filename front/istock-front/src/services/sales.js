// src/services/sales.js
import axios from "axios";

const API_URL = "http://localhost:7063/api/ventas"; // Ajustalo si tu endpoint es distinto

export const getAllSales = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const getSaleById = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};

export const createSale = async (saleData) => {
  const res = await axios.post(API_URL, saleData);
  return res.data;
};

export const updateSale = async (id, updatedData) => {
  const res = await axios.put(`${API_URL}/${id}`, updatedData);
  return res.data;
};

export const deleteSale = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};

// services/sales.js
export async function getSalesPaged({ page = 1, pageSize = 10, search = "" } = {}) {
  const params = new URLSearchParams({ page, pageSize, search });
  const res = await fetch(`/api/ventas/paged?${params.toString()}`);
  if (!res.ok) throw new Error("Error al obtener ventas paginadas");
  return res.json();
}
