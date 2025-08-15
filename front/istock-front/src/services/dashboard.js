// src/services/dashboard.js
import api from "./api";

// GET: /api/ventas/estadisticas
export async function getEstadisticas() {
  const { data } = await api.get("/ventas/estadisticas");
  return data;
}

// GET: /api/ventas/bajostock
export async function getProductosBajoStock() {
  const { data } = await api.get("/ventas/bajostock");
  return data;
}