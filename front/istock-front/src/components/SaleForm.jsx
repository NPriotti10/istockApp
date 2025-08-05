import React, { useEffect, useState } from "react";
import { crearVenta } from "../services/saleService";
import axios from "axios";

export default function SaleForm() {
  const [cliente, setCliente] = useState("");
  const [formaPago, setFormaPago] = useState("Efectivo");
  const [productos, setProductos] = useState([]);
  const [items, setItems] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    axios.get("http://localhost:7063/api/productos")
      .then(res => setProductos(res.data))
      .catch(err => console.error(err));
  }, []);

  const agregarItem = () => {
    const prod = productos.find(p => p.idProducto === parseInt(productoSeleccionado));
    if (!prod || cantidad <= 0) return;

    const precioTotal = prod.precioVenta * cantidad;
    const ganancia = (prod.precioVenta - prod.precioCosto) * cantidad;

    setItems(prev => [
      ...prev,
      {
        idProducto: prod.idProducto,
        nombreProducto: prod.nombre,
        cantidad,
        precioVenta: prod.precioVenta,
        precioCosto: prod.precioCosto,
        precioTotal,
        ganancia
      }
    ]);

    setCantidad(1);
  };

  const precioFinal = items.reduce((acc, item) => acc + item.precioTotal, 0);
  const gananciaTotal = items.reduce((acc, item) => acc + item.ganancia, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const venta = {
      cliente,
      formaPago,
      items
    };

    await crearVenta(venta);
    alert("Venta registrada correctamente");
    setCliente("");
    setFormaPago("Efectivo");
    setItems([]);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Registrar nueva venta</h2>
      <input
        type="text"
        placeholder="Cliente"
        value={cliente}
        onChange={e => setCliente(e.target.value)}
        required
      />
      <select value={formaPago} onChange={e => setFormaPago(e.target.value)}>
        <option value="Efectivo">Efectivo</option>
        <option value="Transferencia">Transferencia</option>
      </select>

      <div>
        <select onChange={e => setProductoSeleccionado(e.target.value)} value={productoSeleccionado}>
          <option value="">Seleccioná un producto</option>
          {productos.map(p => (
            <option key={p.idProducto} value={p.idProducto}>
              {p.nombre} - ${p.precioVenta}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          value={cantidad}
          onChange={e => setCantidad(parseInt(e.target.value))}
        />
        <button type="button" onClick={agregarItem}>Agregar</button>
      </div>

      <ul>
        {items.map((item, i) => (
          <li key={i}>
            {item.nombreProducto} x{item.cantidad} = ${item.precioTotal} (Ganancia: ${item.ganancia})
          </li>
        ))}
      </ul>

      <h4>Total: ${precioFinal}</h4>
      <h4>Ganancia: ${gananciaTotal}</h4>

      <button type="submit">Registrar Venta</button>
    </form>
  );
}
