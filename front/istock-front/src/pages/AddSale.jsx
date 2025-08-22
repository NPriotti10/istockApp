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
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
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
  };

  const handleChangeCantidad = (index, value) => {
    const nuevos = [...items];
    const prod = mapById[nuevos[index].idProducto];
    const cantidad = Math.max(1, Number(value) || 1);
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
      if (!String(it.numeroSerie || "").trim()) {
        alert(`Ingresá el número de serie para "${prod.nombre}".`);
        return false;
      }
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
      fecha,
      cliente,
      formaPago,
      valorDolar: Number(valorDolar),
      equipoPartePago,
      items: items.map(({ idProducto, cantidad, numeroSerie }) => ({
        idProducto: Number(idProducto),
        cantidad: Number(cantidad),
        numeroSerie: String(numeroSerie).trim(),
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

  const productosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return productos.filter((p) => (p.nombre || "").toLowerCase().includes(q));
  }, [productos, busqueda]);

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
      border: "1px solid #ccc",
      borderRadius: 6,
      maxHeight: 160,
      overflowY: "auto",
      backgroundColor: "#fff",
      position: "absolute",
      zIndex: 10,
      width: "100%",
      boxShadow: "0 6px 18px rgba(0,0,0,.08)",
    },
    dropdownItem: {
      padding: 8,
      cursor: "pointer",
      borderBottom: "1px solid #f0f0f0",
    },
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
            <label style={styles.label}>Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={styles.input} required />
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

        {/* buscador manual */}
        <div style={{ position: "relative", marginBottom: 8 }}>
          <input
            type="text"
            placeholder="Buscar producto por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ ...styles.input }}
          />
          {busqueda && (
            <div style={styles.dropdown}>
              {productosFiltrados.map((p) => (
                <div
                  key={p.idProducto}
                  style={styles.dropdownItem}
                  onClick={() => handleAddItemFromSearch(p)}
                >
                  {p.nombre} &nbsp; <small>(Stock: {p.stockActual})</small>
                </div>
              ))}
              {productosFiltrados.length === 0 && (
                <div style={{ padding: 8, color: "#64748b" }}>Sin resultados…</div>
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
          <strong>Total USD:</strong> ${total.toFixed(2)} <br />
          <strong>Total ARS:</strong> ${totalARS.toFixed(2)} <br />
          <strong>Ganancia:</strong> ${ganancia.toFixed(2)}
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
