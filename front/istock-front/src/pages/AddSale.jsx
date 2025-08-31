// src/pages/AddSale.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getProductsPaged } from "../services/products";
import { createSale } from "../services/sales";
import { getDolarValue } from "../services/dolar";
import { useNavigate } from "react-router-dom";

export default function AddSale() {
  const [productos, setProductos] = useState([]); // { idProducto, nombre, stockActual, precioCosto, precioVenta, categoria?, codigoBarra? }
  const [items, setItems] = useState([]);         // { idProducto, cantidad, numeroSerie }
  const [cliente, setCliente] = useState("");
  const [formaPago, setFormaPago] = useState("");
  const [valorDolar, setValorDolar] = useState("");
  const [equipoPartePago, setEquipoPartePago] = useState("");

  // 🔹 ahora guardamos fecha y HORA locales en el input "datetime-local"
  const nowLocalForInput = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const h = pad(d.getHours());
    const min = pad(d.getMinutes());
    const sec = pad(d.getSeconds());
    // incluir segundos (step=1 en el input) para máxima precisión
    return `${y}-${m}-${day}T${h}:${min}:${sec}`;
  };
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
      if (now - lastKeyTimeRef.current > 120) {
        bufferRef.current = "";
      }
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

  // Cálculo totales/ganancia ALINEADO CON EL BACK (Accesorios en ARS → USD)
  const moneyUSD = (n) =>
    typeof n === "number" && !Number.isNaN(n)
      ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "-";

  const calcularTotalYGanancia = () => {
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
  };

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

    // ⚠️ Enviamos la fecha con HORA tal como sale del input datetime-local (YYYY-MM-DDTHH:mm[:ss])
    // El binder de ASP.NET la toma como DateTime local (Kind=Unspecified) con esa hora.
    const venta = {
      fecha: fechaHora,
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

  const { total, ganancia, totalARS } = calcularTotalYGanancia();

  // ===== Buscador mejorado =====
  const productosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    const list = productos.filter((p) => (p.nombre || "").toLowerCase().includes(q));
    // pequeño orden: primero con stock, luego alfabético
    return list.sort((a, b) => {
      const sa = Number(a.stockActual ?? 0);
      const sb = Number(b.stockActual ?? 0);
      if (sa > 0 && sb <= 0) return -1;
      if (sa <= 0 && sb > 0) return 1;
      return (a.nombre || "").localeCompare(b.nombre || "");
    });
  }, [productos, busqueda]);

  // navegación con teclado en el dropdown
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

  // ===== estilos =====
  const styles = {
    container: {
      padding: 24,
      maxWidth: 820,
      margin: "0 auto",
      background: "#f9f9f9",
      borderRadius: 12,
      boxShadow: "0 0 10px rgba(0,0,0,0.08)",
      position: "relative",
    },
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    formGroup: { marginBottom: 16, display: "flex", flexDirection: "column" },
    label: { marginBottom: 6, fontWeight: 600, fontSize: 14 },
    input: { padding: 8, border: "1px solid #ccc", borderRadius: 6 },
    button: {
      padding: "8px 12px",
      background: "#2557d6",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      cursor: "pointer",
      fontWeight: "bold",
    },
    removeBtn: { background: "#dc3545" },
    dropdown: {
      border: "1px solid #d7deea",
      borderRadius: 10,
      maxHeight: 260,
      overflowY: "auto",
      backgroundColor: "#fff",
      position: "absolute",
      zIndex: 10,
      width: "100%",
      boxShadow: "0 12px 28px rgba(16,24,40,.12)",
      marginTop: 6,
    },
    dropdownItem: {
      padding: 10,
      cursor: "pointer",
      borderBottom: "1px solid #f1f5f9",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    chip: {
      fontSize: 12,
      padding: "3px 8px",
      borderRadius: 999,
      border: "1px solid #e5e7eb",
      background: "#f8fafc",
      color: "#0f172a",
    },
    stockDot: (ok) => ({
      width: 8,
      height: 8,
      borderRadius: 999,
      background: ok ? "#16a34a" : "#ef4444",
      marginRight: 8,
    }),
    cantidadInput: { width: 70, textAlign: "center", padding: 8, border: "1px solid #ccc", borderRadius: 6 },
    serialInput: { display: "block", marginTop: 8, padding: 8, border: "1px solid #ccc", borderRadius: 6, width: 280 },
    badge: {
      display: "inline-flex",
      gap: 6,
      alignItems: "center",
      fontSize: 12,
      border: "1px solid #cfe0ff",
      background: "#eaf1ff",
      color: "#1e3a8a",
      padding: "6px 10px",
      borderRadius: 999,
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={{ textAlign: "center", marginBottom: 18 }}>Nueva Venta</h2>

      {/* Estado del lector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={styles.badge}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: scannerEnabled ? "#16a34a" : "#e11d48",
            }}
          />
          Lector: <strong>{scannerEnabled ? "ACTIVO" : "INACTIVO"}</strong> (F9 para alternar)
        </div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={scannerEnabled}
            onChange={(e) => setScannerEnabled(e.target.checked)}
          />
          Usar lector de códigos
        </label>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Fecha y hora</label>
            <input
              type="datetime-local"
              step="1"
              value={fechaHora}
              onChange={(e) => setFechaHora(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Cliente</label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              style={styles.input}
              placeholder="Nombre del cliente"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Forma de pago</label>
            <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)} style={styles.input} required>
              <option value="">Seleccionar</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Valor del dólar</label>
            <input
              type="number"
              step="0.01"
              value={valorDolar}
              onChange={(e) => setValorDolar(e.target.value)}
              style={styles.input}
              required
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Equipo tomado como parte de pago (opcional)</label>
          <input
            type="text"
            value={equipoPartePago}
            onChange={(e) => setEquipoPartePago(e.target.value)}
            style={styles.input}
            placeholder="Ej: iPhone 13 Black - 85% Bat - 64gb"
          />
        </div>

        <hr style={{ margin: "18px 0" }} />

        <h3>Productos</h3>

        {/* buscador manual (mejorado) */}
        <div style={{ position: "relative", marginBottom: 8 }}>
          <input
            type="text"
            placeholder="Buscar producto por nombre..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onSearchKeyDown}
            style={{ ...styles.input }}
          />
          {busqueda && (
            <div style={styles.dropdown}>
              {productosFiltrados.slice(0, 20).map((p, i) => {
                const inStock = Number(p.stockActual ?? 0) > 0;
                const usd = Number(valorDolar) || 1;
                const isAcc = (p.categoria?.nombre || "").trim().toLowerCase() === "accesorio";
                const ventaUSD = isAcc ? (Number(p.precioVenta ?? 0) / usd) : Number(p.precioVenta ?? 0);

                return (
                  <div
                    key={p.idProducto}
                    style={{
                      ...styles.dropdownItem,
                      background: i === activeIndex ? "#eef2ff" : "#fff",
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => handleAddItemFromSearch(p)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={styles.stockDot(inStock)} />
                      <div>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{p.nombre}</div>
                        <small style={{ color: "#64748b" }}>
                          {p.categoria?.nombre || "Sin categoría"}
                          {" · "}Stock: {p.stockActual ?? 0}
                        </small>
                      </div>
                    </div>
                    <div>
                      <span style={styles.chip}>
                        {moneyUSD(ventaUSD)} {isAcc ? "USD* (precio en ARS)" : "USD"}
                      </span>
                    </div>
                  </div>
                );
              })}
              {productosFiltrados.length === 0 && (
                <div style={{ padding: 12, color: "#64748b" }}>Sin resultados…</div>
              )}
            </div>
          )}
        </div>

        {/* listado de ítems */}
        {items.map((item, index) => {
          const prod = mapById[item.idProducto];
          return (
            <div key={index} style={{ marginTop: 12, borderBottom: "1px solid #e5e7eb", paddingBottom: 10 }}>
              <div>
                <strong>{prod?.nombre}</strong>{" "}
                <small style={{ color: "#64748b" }}>(Stock: {prod?.stockActual})</small>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={() => handleDecrement(index)} style={styles.button}>-</button>
                <input
                  type="number"
                  min={1}
                  value={item.cantidad}
                  onChange={(e) => handleChangeCantidad(index, e.target.value)}
                  style={styles.cantidadInput}
                />
                <button type="button" onClick={() => handleIncrement(index)} style={styles.button}>+</button>

                <input
                  type="text"
                  placeholder="Número de serie"
                  value={item.numeroSerie || ""}
                  onChange={(e) => handleSerieChange(index, e.target.value)}
                  style={styles.serialInput}
                />

                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  style={{ ...styles.button, ...styles.removeBtn }}
                >
                  ❌ Eliminar
                </button>
              </div>
            </div>
          );
        })}

        {/* totales */}
        <div style={{ marginTop: 16, lineHeight: 1.7 }}>
          <strong>Total USD:</strong> {moneyUSD(total)} <br />
          <strong>Total ARS:</strong> {moneyUSD(totalARS)} <br />
          <strong>Ganancia:</strong> {moneyUSD(ganancia)}
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{ ...styles.button, marginTop: 20, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Guardando…" : "Guardar Venta"}
        </button>
      </form>
    </div>
  );
}
