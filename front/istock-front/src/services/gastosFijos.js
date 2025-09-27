// src/services/gastosFijos.js
import api from "./api"; // usa el cliente con baseURL y JWT

// Pequeña tabla de equivalencias por si el API llegara a devolver 0/1
export const TIPO_GASTO = {
  Pesos: "Pesos",
  Dolares: "Dolares",
};

const enumToString = (val) => {
  // Soporta "Pesos"/"Dolares" o 0/1
  if (val === 0 || val === "0") return TIPO_GASTO.Pesos;
  if (val === 1 || val === "1") return TIPO_GASTO.Dolares;
  // Cualquier otra cosa => deja string tal cual (esperado con JsonStringEnumConverter)
  return (val ?? "").toString();
};

const normalizeOut = (row) => ({
  id: row.id ?? row.idGastoFijo ?? row.Id ?? row.IdGastoFijo,
  nombre: row.nombre ?? row.Nombre ?? "",
  monto: Number(row.monto ?? row.Monto ?? 0),
  tipo: enumToString(row.tipo ?? row.Tipo ?? ""),
});

const normalizeIn = (g) => ({
  nombre: (g?.nombre ?? "").trim(),
  monto: Number(g?.monto ?? 0),
  // Forzamos exactamente "Pesos" o "Dolares"
  tipo: g?.tipo === TIPO_GASTO.Dolares ? TIPO_GASTO.Dolares : TIPO_GASTO.Pesos,
});

// GET: /api/GastosFijos
export async function getGastosFijos() {
  const { data } = await api.get("/GastosFijos");
  const arr = Array.isArray(data) ? data : [];
  return arr.map(normalizeOut);
}

// POST: /api/GastosFijos
export async function addGastoFijo(nuevoGasto) {
  const payload = normalizeIn(nuevoGasto);
  const { data } = await api.post("/GastosFijos", payload);
  return normalizeOut(data);
}

// DELETE: /api/GastosFijos/{id}
export async function deleteGastoFijo(id) {
  const { data } = await api.delete(`/GastosFijos/${id}`);
  return data;
}

// PUT: /api/GastosFijos/{id}
export async function updateGastoFijo(id, gastoActualizado) {
  // Si tu API de PUT espera el DTO completo con Id, mandalo:
  const payload = { id, ...normalizeIn(gastoActualizado) };
  const { data } = await api.put(`/GastosFijos/${id}`, payload);
  // Algunos PUT devuelven vacío (204). Si vino algo, lo normalizamos; si no, retornamos payload.
  return data ? normalizeOut(data) : payload;
}
