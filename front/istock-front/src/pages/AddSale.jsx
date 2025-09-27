import React, { useEffect, useMemo, useRef, useState } from "react";
import { getProductsPaged } from "../services/products";
import { createSale } from "../services/sales";
import { getDolarValue } from "../services/dolar";
import { useNavigate } from "react-router-dom";

export default function AddSale() {
  const [productos, setProductos] = useState([]);
  const [items, setItems] = useState([]); // { idProducto, cantidad, numeroSerie }
  const [cliente, setCliente] = useState("");
  const [formaPago, setFormaPago] = useState("");
  const [valorDolar, setValorDolar] = useState("");
  const [equipoPartePago, setEquipoPartePago] = useState("");
  const [fechaHora, setFechaHora] = useState(nowLocalForInput());

  const [busqueda, setBusqueda] = useState("");
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  // ===== lector de códigos =====
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const finalizeTimerRef = useRef(null);

  // Carga inicial
  useEffect(() => {
    getProductsPaged({ page: 1, pageSize: 9999 })
      .then((res) => setProductos(res.items || res || []))
      .catch(() => alert("Error al obtener productos"));

    getDolarValue()
      .then(setValorDolar)
      .catch(() => {
        console.warn("No se pudo obtener el valor del dólar");
        setValorDolar(0);
      });
  }, []);

  // Mapa por id (performance)
  const mapById = useMemo(() => {
    const m = {};
    for (const p of productos) m[p.idProducto] = p;
    return m;
  }, [productos]);

  // Normalizador y mapa por código de barras
  const normalize = (s) => String(s ?? "").replace(/\s+/g, "").toUpperCase();
  const mapByBarcode = useMemo(() => {
    const m = {};
    for (const p of productos) {
      const code = normalize(p.codigoBarra);
      if (code) m[code] = p;
    }
    return m;
  }, [productos]);

  // Helpers del escáner
  const isTypingInInput = () => {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    const editable = el.getAttribute && el.getAttribute("contenteditable");
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || editable === "true";
  };
  const isCodeChar = (key) => /^[0-9A-Za-z\-_.]$/.test(key);

  const finalizeScan = () => {
    const raw = normalize(bufferRef.current);
    bufferRef.current = "";
    if (!raw || raw.length < 3) return;

    const prod = mapByBarcode[raw];
    if (!prod) {
      console.warn(`Código ${raw} no encontrado`);
      return;
    }

    setItems((prev) => {
      const idx = prev.findIndex((it) => Number(it.idProducto) === Number(prod.idProducto));
      if (idx !== -1) {
        const copia = [...prev];
        const nuevaCant = copia[idx].cantidad + 1;
        if (nuevaCant > (prod.stockActual ?? 0)) {
          alert(`Stock insuficiente para ${prod.nombre}. Disponible: ${prod.stockActual}`);
          return prev;
        }
        copia[idx] = { ...copia[idx], cantidad: nuevaCant };
        return copia;
      }
      if ((prod.stockActual ?? 0) < 1) {
        alert(`Sin stock para ${prod.nombre}`);
        return prev;
      }
      return [...prev, { idProducto: prod.idProducto, cantidad: 1, numeroSerie: "" }];
    });
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      // F9: activar/desactivar escáner
      if (e.key === "F9") {
        setScannerEnabled((s) => !s);
        return;
      }
      if (!scannerEnabled) return;
      if (isTypingInInput()) return;

      const now = Date.now();
      if (now - lastKeyTimeRef.current > 120) bufferRef.current = "";
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        if (finalizeTimerRef.current) clearTimeout(finalizeTimerRef.current);
        finalizeScan();
        return;
      }
      if (!isCodeChar(e.key)) return;

      bufferRef.current += e.key;
      if (finalizeTimerRef.current) clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = setTimeout(finalizeScan, 140);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (finalizeTimerRef.current) clearTimeout(finalizeTimerRef.current);
    };
  }, [scannerEnabled, mapByBarcode]);

  // ===================== lógica de items =====================
  const handleAddItemFromSearch = (producto) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => Number(it.idProducto) === Number(producto.idProducto));
      if (idx !== -1) {
        const copia = [...prev];
        const nuevaCant = copia[idx].cantidad + 1;
        if (nuevaCant > (producto.stockActual ?? 0)) {
          alert(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stockActual}`);
          return prev;
        }
        copia[idx] = { ...copia[idx], cantidad: nuevaCant };
        return copia;
      }
      if ((producto.stockActual ?? 0) < 1) {
        alert(`Sin stock para ${producto.nombre}`);
        return prev;
      }
      return [...prev, { idProducto: producto.idProducto, cantidad: 1, numeroSerie: "" }];
    });
    setBusqueda("");
    setActiveIndex(0);
  };

  const handleChangeCantidad = (index, value) => {
    const nuevos = [...items];
    const prod = mapById[nuevos[index].idProducto];
    const cantidad = Math.max(0, Number(value) || 0);
    if (prod && cantidad > (prod.stockActual ?? 0)) {
      alert(`Stock insuficiente para ${prod.nombre}. Disponible: ${prod.stockActual}`);
      return;
    }
    nuevos[index].cantidad = cantidad;
    setItems(nuevos);
  };

  const handleIncrement = (index) => handleChangeCantidad(index, items[index].cantidad + 1);
  const handleDecrement = (index) => handleChangeCantidad(index, items[index].cantidad - 1);
  const handleRemoveItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));
  const handleSerieChange = (index, valor) =>
    setItems((prev) => {
      const copy = [...prev];
      copy[index].numeroSerie = valor;
      return copy;
    });

  // Totales alineados con el back (Accesorios en ARS → USD)
  const moneyUSD = (n) =>
    typeof n === "number" && !Number.isNaN(n)
      ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "-";

  const { total, ganancia, totalARS } = useMemo(() => {
    let total = 0;
    let ganancia = 0;
    const usd = Number(valorDolar) || 1;

    items.forEach(({ idProducto, cantidad }) => {
      const prod = mapById[idProducto];
      if (!prod) return;

      const isAcc = (prod.categoria?.nombre || "").trim().toLowerCase() === "accesorio";
      const ventaUSD = isAcc ? (Number(prod.precioVenta ?? 0) / usd) : Number(prod.precioVenta ?? 0);
      const costoUSD = isAcc ? (Number(prod.precioCosto ?? 0) / usd) : Number(prod.precioCosto ?? 0);

      total += ventaUSD * cantidad;
      ganancia += (ventaUSD - costoUSD) * cantidad;
    });

    const totalARS = total * (Number(valorDolar) || 1);
    return { total, ganancia, totalARS };
  }, [items, mapById, valorDolar]);

  const validar = () => {
    if ((Number(valorDolar) || 0) <= 0) {
      alert("Ingresá un valor de dólar válido (> 0).");
      return false;
    }
    if (items.length === 0) {
      alert("Agregá al menos un producto.");
      return false;
    }
    for (const it of items) {
      const prod = mapById[it.idProducto];
      if (!prod) continue;
      if (it.cantidad > (prod.stockActual ?? 0)) {
        alert(`Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stockActual}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!validar()) return;
    if (!confirm("¿Estás seguro de guardar esta venta?")) return;

    const venta = {
      fecha: fechaHora, // YYYY-MM-DDTHH:mm[:ss]
      cliente,
      formaPago,
      valorDolar: Number(valorDolar),
      equipoPartePago,
      items: items.map(({ idProducto, cantidad, numeroSerie }) => ({
        idProducto: Number(idProducto),
        cantidad: Number(cantidad),
        numeroSerie: (String(numeroSerie || "").trim() || null),
      })),
    };

    setSaving(true);
    try {
      await createSale(venta);
      alert("✅ Venta registrada con éxito");
      navigate("/ventas");
    } catch (err) {
      console.error("Error al guardar la venta:", err);
      alert("❌ Ocurrió un error al registrar la venta");
    } finally {
      setSaving(false);
    }
  };

  // ===== Buscador con dropdown =====
  const productosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    const list = productos.filter((p) => (p.nombre || "").toLowerCase().includes(q));
    return list.sort((a, b) => {
      const sa = Number(a.stockActual ?? 0);
      const sb = Number(b.stockActual ?? 0);
      if (sa > 0 && sb <= 0) return -1;
      if (sa <= 0 && sb > 0) return 1;
      return (a.nombre || "").localeCompare(b.nombre || "");
    });
  }, [productos, busqueda]);

  const [activeIndex, setActiveIndex] = useState(0);
  const onSearchKeyDown = (e) => {
    if (!productosFiltrados.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % productosFiltrados.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + productosFiltrados.length) % productosFiltrados.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = productosFiltrados[activeIndex] || productosFiltrados[0];
      if (item) handleAddItemFromSearch(item);
    } else if (e.key === "Escape") {
      setBusqueda("");
    }
  };

  return (
    <div className="body-bg">
      <div className="add-product-container" style={{ maxWidth: 900 }}>
        {/* Encabezado */}
        <div className="products-header" style={{ paddingTop: 0 }}>
          <h2 className="add-product-title" style={{ marginBottom: 0 }}>Nueva Venta</h2>
          <div
            className="chip"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid #cfe0ff",
              background: "#eaf1ff",
              color: "#1e3a8a",
              fontSize: 12
            }}
          >
            <span
              style={{
                width: 8, height: 8, borderRadius: 999,
                background: scannerEnabled ? "#16a34a" : "#e11d48"
              }}
            />
            Lector: <strong>{scannerEnabled ? "ACTIVO" : "INACTIVO"}</strong> (F9 para alternar)
          </div>
        </div>

        {/* Toggle lector */}
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={scannerEnabled}
            onChange={(e) => setScannerEnabled(e.target.checked)}
          />
          Usar lector de códigos
        </label>

        {/* Form */}
        <form onSubmit={handleSubmit} className="form-container" style={{ maxWidth: "100%" }}>
          {/* Grid básico */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              <span>Fecha y hora</span>
              <input
                className="input"
                type="datetime-local"
                step="1"
                value={fechaHora}
                onChange={(e) => setFechaHora(e.target.value)}
                required
              />
            </label>

            <label>
              <span>Cliente</span>
              <input
                className="input"
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Nombre del cliente"
                required
              />
            </label>

            <label>
              <span>Forma de pago</span>
              <select
                className="select"
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value)}
                required
              >
                <option value="">Seleccionar</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Otro">Otro</option>
              </select>
            </label>

            <label>
              <span>Valor del dólar</span>
              <input
                className="input"
                type="number"
                step="0.01"
                value={valorDolar}
                onChange={(e) => setValorDolar(e.target.value)}
                required
              />
            </label>
          </div>

          <label>
            <span>Equipo tomado como parte de pago (opcional)</span>
            <input
              className="input"
              type="text"
              value={equipoPartePago}
              onChange={(e) => setEquipoPartePago(e.target.value)}
              placeholder="Ej: iPhone 13 Black - 85% Bat - 64gb"
            />
          </label>

          <hr style={{ margin: "14px 0 10px" }} />

          <h3 style={{ margin: "6px 0 8px" }}>Productos</h3>

          {/* Buscador con dropdown */}
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input
              className="input"
              type="text"
              placeholder="Buscar producto por nombre..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setActiveIndex(0); }}
              onKeyDown={onSearchKeyDown}
              autoComplete="off"
            />
            {busqueda && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 10,
                  width: "100%",
                  maxHeight: 260,
                  overflowY: "auto",
                  marginTop: 6,
                  background: "#fff",
                  border: "1px solid #d7deea",
                  borderRadius: 10,
                  boxShadow: "0 12px 28px rgba(16,24,40,.12)"
                }}
              >
                {productosFiltrados.slice(0, 20).map((p, i) => {
                  const inStock = Number(p.stockActual ?? 0) > 0;
                  const usd = Number(valorDolar) || 1;
                  const isAcc = (p.categoria?.nombre || "").trim().toLowerCase() === "accesorio";
                  const ventaUSD = isAcc ? (Number(p.precioVenta ?? 0) / usd) : Number(p.precioVenta ?? 0);

                  return (
                    <div
                      key={p.idProducto}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => handleAddItemFromSearch(p)}
                      style={{
                        padding: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        cursor: "pointer",
                        borderBottom: "1px solid #f1f5f9",
                        background: i === activeIndex ? "#eef2ff" : "#fff"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 8, height: 8, borderRadius: 999,
                            background: inStock ? "#16a34a" : "#ef4444"
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: "#0f172a" }}>{p.nombre}</div>
                          <small style={{ color: "#64748b" }}>
                            {p.categoria?.nombre || "Sin categoría"} {" · "}Stock: {p.stockActual ?? 0}
                          </small>
                        </div>
                      </div>
                      <span
                        className="chip"
                        style={{
                          fontSize: 12,
                          padding: "3px 8px",
                          borderRadius: 999,
                          border: "1px solid #e5e7eb",
                          background: "#f8fafc",
                          color: "#0f172a"
                        }}
                      >
                        {moneyUSD(ventaUSD)} {isAcc ? "USD* (precio en ARS)" : "USD"}
                      </span>
                    </div>
                  );
                })}
                {productosFiltrados.length === 0 && (
                  <div style={{ padding: 12, color: "#64748b" }}>Sin resultados…</div>
                )}
              </div>
            )}
          </div>

          {/* Ítems agregados */}
          {items.map((item, index) => {
            const prod = mapById[item.idProducto];
            return (
              <div key={index} style={{ marginTop: 12, borderBottom: "1px solid #e5e7eb", paddingBottom: 10 }}>
                <div>
                  <strong>{prod?.nombre}</strong>{" "}
                  <small style={{ color: "#64748b" }}>(Stock: {prod?.stockActual})</small>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => handleDecrement(index)} className="btn">-</button>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={item.cantidad}
                    onChange={(e) => handleChangeCantidad(index, e.target.value)}
                    style={{ width: 90, textAlign: "center" }}
                  />
                  <button type="button" onClick={() => handleIncrement(index)} className="btn">+</button>

                  <input
                    className="input"
                    type="text"
                    placeholder="Número de serie"
                    value={item.numeroSerie || ""}
                    onChange={(e) => handleSerieChange(index, e.target.value)}
                    style={{ width: 320 }}
                  />

                  <button type="button" onClick={() => handleRemoveItem(index)} className="btn btn--ghost">
                    ❌ Eliminar
                  </button>
                </div>
              </div>
            );
          })}

          {/* Totales */}
          <div style={{ marginTop: 16, lineHeight: 1.7 }}>
            <strong>Total USD:</strong> {moneyUSD(total)} <br />
            <strong>Total ARS:</strong> {moneyUSD(totalARS)} <br />
            <strong>Ganancia:</strong> {moneyUSD(ganancia)}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="add-product-btn"
            style={{ marginTop: 16 }}
          >
            {saving ? "Guardando…" : "Guardar Venta"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Util: valor por defecto local para datetime-local con segundos
function nowLocalForInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const sec = pad(d.getSeconds());
  return `${y}-${m}-${day}T${h}:${min}:${sec}`;
}
