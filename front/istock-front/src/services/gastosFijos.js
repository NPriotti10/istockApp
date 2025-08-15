// src/services/gastosFijos.js
import api from "./api"; // usa el cliente con baseURL y JWT

// GET: /api/GastosFijos
export async function getGastosFijos() {
  const { data } = await api.get("/GastosFijos");
  return data;
}

// POST: /api/GastosFijos
export async function addGastoFijo(nuevoGasto) {
  const { data } = await api.post("/GastosFijos", nuevoGasto);
  return data;
}

// DELETE: /api/GastosFijos/{id}
export async function deleteGastoFijo(id) {
  const { data } = await api.delete(`/GastosFijos/${id}`);
  return data;
}

// PUT: /api/GastosFijos/{id}
export async function updateGastoFijo(id, gastoActualizado) {
  const { data } = await api.put(`/GastosFijos/${id}`, gastoActualizado);
  return data;
}
