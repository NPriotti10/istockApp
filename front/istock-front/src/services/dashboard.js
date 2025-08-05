const API_BASE = "http://localhost:7063/api/ventas";

export async function getEstadisticas() {
  const res = await fetch(`${API_BASE}/estadisticas`);
  if (!res.ok) throw new Error("Error al obtener estadísticas");
  return await res.json();
}

export async function getProductosBajoStock() {
  const res = await fetch(`${API_BASE}/bajostock`); // ✅ corregido
  if (!res.ok) throw new Error("Error al obtener productos con stock bajo");
  return await res.json();
}
