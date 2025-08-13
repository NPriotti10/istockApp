const BASE_URL = "http://localhost:7063/api/GastosFijos";

export const getGastosFijos = async () => {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Error al obtener gastos fijos");
  return await res.json();
};

export const addGastoFijo = async (nuevoGasto) => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nuevoGasto),
  });
  if (!res.ok) throw new Error("Error al agregar gasto fijo");
  return await res.json();
};

export const deleteGastoFijo = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar gasto fijo");
};

export const updateGastoFijo = async (id, gastoActualizado) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(gastoActualizado),
  });
  if (!res.ok) throw new Error("Error al actualizar gasto fijo");
};
