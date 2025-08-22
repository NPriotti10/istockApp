// src/pages/EditSale.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSaleById, updateSale } from "../services/sales";
import { getProductsPaged } from "../services/products";
import { getDolarValue } from "../services/dolar";

export default function EditSale() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sale, setSale] = useState(null);
  const [items, setItems] = useState([]);                 // [{ idProducto, cantidad, numeroSerie }]
  const [productos, setProductos] = useState([]);         // catálogo completo (para precios/stock)
  const [busqueda, setBusqueda] = useState("");
  const [valorDolar, setValorDolar] = useState(1);
  const [loading, setLoading] = useState(true);

  // ← helper: toma la venta con cualquier “shape” y devuelve los items normalizados
  const extractItemsFromVenta = (venta) => {
    const raw =
      venta?.items ??
      venta?.itemVenta ??
      venta?.productos ??
      venta?.Items ??
      venta?.ItemVenta ??
      venta?.Productos ??
      [];

    return (raw || []).map((x) => ({
      idProducto: Number(
        x.idProducto ??
          x.productoId ??
          x.IdProducto ??
          x.ProductoId ??
          x.id ??
          x.Id ??
          0
      ),
      cantidad: Number(x.cantidad ?? x.Cantidad ?? x.qty ?? 1),
      numeroSerie: String(x.numeroSerie ?? x.NumeroSerie ?? ""),
      // si tu API trae precioUnitario en este array, no lo usamos para calcular;
      // tomamos siempre el precio actual del catálogo (productos) para mostrar.
    }));
  };

  // carga inicial
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [venta, prods, dolar] = await Promise.all([
          getSaleById(id),
          getProductsPaged({ page: 1, pageSize: 9999 }),
          getDolarValue().catch(() => 1),
        ]);
        if (!mounted) return;

        setSale(venta);
        setValorDolar(Number(venta?.valorDolar ?? dolar ?? 1));
        setProductos(prods.items || prods || []);
        setItems(extractItemsFromVenta(venta));
      } catch (e) {
        console.error(e);
        alert("No se pudo cargar la venta o productos.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const findProd = (idProducto) =>
    productos.find((p) => Number(p.idProducto) === Number(idProducto));

  // totales
  const { totalUSD, totalARS, gananciaUSD } = useMemo(() => {
    let total = 0;
    let ganancia = 0;
    for (const it of items) {
      const p = findProd(it.idProducto);
      if (!p) continue;
      const costo = Number(p.precioCosto ?? 0);
      const venta = Number(p.precioVenta ?? 0);
      total += venta * Number(it.cantidad ?? 0);
      ganancia += (venta - costo) * Number(it.cantidad ?? 0);
    }
    const vd = Number(valorDolar || 1);
    return { totalUSD: total, totalARS: total * vd, gananciaUSD: ganancia };
  }, [items, productos, valorDolar]);

  // búsqueda
  const productosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return productos.filter((p) => (p.nombre || "").toLowerCase().includes(q));
  }, [productos, busqueda]);

  // acciones de ítems
  const handleAddItemFromSearch = (producto) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => Number(it.idProducto) === Number(producto.idProducto));
      if (idx !== -1) {
        const nuevo = [...prev];
        const cantNueva = nuevo[idx].cantidad + 1;
        if (cantNueva > (producto.stockActual ?? 0)) {
          alert(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stockActual}`);
          return prev;
        }
        nuevo[idx] = { ...nuevo[idx], cantidad: cantNueva };
        return nuevo;
      }
      if ((producto.stockActual ?? 0) < 1) {
        alert(`Sin stock para ${producto.nombre}`);
        return prev;
      }
      return [...prev, { idProducto: producto.idProducto, cantidad: 1, numeroSerie: "" }];
    });
    setBusqueda("");
  };

  const handleChangeCantidad = (index, value) => {
    const nuevo = [...items];
    const prod = findProd(nuevo[index].idProducto);
    const cant = Math.max(1, Number(value) || 1);
    if (prod && cant > (prod.stockActual ?? 0)) {
      alert(`Stock insuficiente para ${prod.nombre}. Disponible: ${prod.stockActual}`);
      return;
    }
    nuevo[index].cantidad = cant;
    setItems(nuevo);
  };
  const inc = (i) => handleChangeCantidad(i, items[i].cantidad + 1);
  const dec = (i) => handleChangeCantidad(i, items[i].cantidad - 1);

  const handleSerieChange = (index, v) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index].numeroSerie = v;
      return copy;
    });
  };

  const removeItem = (index) => {
    const nuevo = [...items];
    nuevo.splice(index, 1);
    setItems(nuevo);
  };

  // validación
  const validar = () => {
    if (!sale) return false;
    if (items.length === 0) {
      alert("Agregá al menos un producto.");
      return false;
    }
    for (const it of items) {
      const p = findProd(it.idProducto);
      if (!p) continue;
      if (!String(it.numeroSerie || "").trim()) {
        alert(`Ingresá el número de serie para "${p.nombre}".`);
        return false;
      }
      if (Number(it.cantidad) > (p.stockActual ?? 0)) {
        alert(`Stock insuficiente para "${p.nombre}". Disponible: ${p.stockActual}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    if (!confirm("¿Guardar cambios en la venta?")) return;

    const payload = {
      fecha: sale.fecha,
      cliente: sale.cliente,
      formaPago: sale.formaPago,
      valorDolar: Number(valorDolar),
      equipoPartePago: sale.equipoPartePago,
      items: items.map(({ idProducto, cantidad, numeroSerie }) => ({
        idProducto: Number(idProducto),
        cantidad: Number(cantidad),
        numeroSerie: String(numeroSerie || "").trim(),
      })),
    };

    try {
      await updateSale(id, payload);
      alert("✅ Venta actualizada correctamente");
      navigate("/ventas");
    } catch (err) {
      console.error("Error al actualizar venta:", err);
      alert("❌ Error al actualizar venta");
    }
  };

  // estilos
  const S = {
    container: {
      padding: 24,
      maxWidth: 860,
      margin: "0 auto",
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,.06)",
    },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    group: { marginBottom: 14, display: "flex", flexDirection: "column" },
    label: { marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#374151" },
    input: { padding: 10, borderRadius: 8, border: "1px solid #d1d5db", fontSize: 16 },
    btn: {
      padding: "10px 14px",
      background: "#2563eb",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      fontWeight: 600,
      cursor: "pointer",
    },
    danger: { background: "#dc2626" },
    row: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
    qty: { width: 80, textAlign: "center", padding: 8, border: "1px solid #d1d5db", borderRadius: 6 },
    serial: { width: 280, padding: 8, border: "1px solid #d1d5db", borderRadius: 6 },
    hr: { margin: "18px 0", border: "none", borderTop: "1px solid #eee" },
    dropdown: {
      position: "absolute",
      zIndex: 10,
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 8,
      boxShadow: "0 8px 24px rgba(0,0,0,.08)",
      width: "100%",
      maxHeight: 220,
      overflowY: "auto",
    },
    ddItem: { padding: 10, borderBottom: "1px solid #f3f4f6", cursor: "pointer" },
    totalBox: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0,1fr))",
      gap: 12,
      marginTop: 12,
    },
    totalCard: {
      background: "#f8fafc",
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      padding: 12,
      fontWeight: 700,
      color: "#1f2937",
    },
  };

  return (
    <div style={S.container}>
      <h2 style={{ textAlign: "center", marginBottom: 16 }}>Editar Venta</h2>

      {loading ? (
        <p>Cargando…</p>
      ) : !sale ? (
        <p>No se encontró la venta.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Cabecera */}
          <div style={S.grid2}>
            <div style={S.group}>
              <label style={S.label}>Cliente</label>
              <input
                style={S.input}
                value={sale.cliente || ""}
                onChange={(e) => setSale((s) => ({ ...s, cliente: e.target.value }))}
                required
              />
            </div>
            <div style={S.group}>
              <label style={S.label}>Fecha</label>
              <input
                type="date"
                style={S.input}
                value={sale.fecha?.split("T")[0] || ""}
                onChange={(e) => setSale((s) => ({ ...s, fecha: e.target.value }))}
                required
              />
            </div>
            <div style={S.group}>
              <label style={S.label}>Forma de pago</label>
              <select
                style={S.input}
                value={sale.formaPago || ""}
                onChange={(e) => setSale((s) => ({ ...s, formaPago: e.target.value }))}
                required
              >
                <option value="">Seleccionar</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div style={S.group}>
              <label style={S.label}>Valor del dólar</label>
              <input
                type="number"
                step="0.01"
                style={S.input}
                value={valorDolar}
                onChange={(e) => setValorDolar(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={S.group}>
            <label style={S.label}>Equipo parte de pago (opcional)</label>
            <input
              style={S.input}
              value={sale.equipoPartePago || ""}
              onChange={(e) => setSale((s) => ({ ...s, equipoPartePago: e.target.value }))}
              placeholder="Ej: iPhone 13 Black - 85% Bat - 64gb"
            />
          </div>

          <hr style={S.hr} />

          {/* Buscador para agregar productos */}
          <div style={{ position: "relative", marginBottom: 8 }}>
            <label style={S.label}>Agregar productos</label>
            <input
              style={S.input}
              placeholder="Buscar por nombre…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <div style={S.dropdown}>
                {productosFiltrados.map((p) => (
                  <div
                    key={p.idProducto}
                    style={S.ddItem}
                    onClick={() => handleAddItemFromSearch(p)}
                  >
                    {p.nombre} &nbsp; <small>(Stock: {p.stockActual})</small>
                  </div>
                ))}
                {productosFiltrados.length === 0 && (
                  <div style={{ padding: 10, color: "#6b7280" }}>Sin resultados…</div>
                )}
              </div>
            )}
          </div>

          {/* Ítems de la venta */}
          {items.length === 0 ? (
            <p style={{ color: "#6b7280", marginTop: 8 }}>No hay productos en esta venta.</p>
          ) : (
            items.map((it, i) => {
              const p = findProd(it.idProducto);
              return (
                <div key={`${it.idProducto}-${i}`} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
                  <div style={{ fontWeight: 700 }}>
                    {p?.nombre || `Producto #${it.idProducto}`}{" "}
                    <small style={{ color: "#6b7280" }}>(Stock: {p?.stockActual ?? "-"})</small>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" style={S.btn} onClick={() => dec(i)}>-</button>
                    <input
                      type="number"
                      min={1}
                      value={it.cantidad}
                      onChange={(e) => handleChangeCantidad(i, e.target.value)}
                      style={S.qty}
                    />
                    <button type="button" style={S.btn} onClick={() => inc(i)}>+</button>

                    <input
                      type="text"
                      placeholder="Número de serie"
                      value={it.numeroSerie || ""}
                      onChange={(e) => handleSerieChange(i, e.target.value)}
                      style={S.serial}
                    />

                    <button
                      type="button"
                      style={{ ...S.btn, ...S.danger }}
                      onClick={() => removeItem(i)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Totales */}
          <div style={S.totalBox}>
            <div style={S.totalCard}>Total USD: ${totalUSD.toFixed(2)}</div>
            <div style={S.totalCard}>Total ARS: ${totalARS.toFixed(2)}</div>
            <div style={S.totalCard}>Ganancia USD: ${gananciaUSD.toFixed(2)}</div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button type="submit" style={S.btn}>Guardar cambios</button>
          </div>
        </form>
      )}
    </div>
  );
}
