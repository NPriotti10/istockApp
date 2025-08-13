// src/pages/NuevoProducto.jsx
import React, { useState, useEffect } from "react";
import { nuevoProduct } from "../services/products";
import { getAllCategorias } from "../services/categorias";
import { useNavigate, useLocation } from "react-router-dom";
import { useSearchParams } from "react-router-dom";


export default function AddProduct() {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precioCosto: "",
    precioVenta: "",
    stockActual: "",
    stockMinimo: "",
    idCategoria: ""
  });
  const [categorias, setCategorias] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoriaPredefinida = searchParams.get("categoria") || "";
  const location = useLocation()
  useEffect(() => {
    getAllCategorias().then(setCategorias);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name.includes("precio") || name.includes("stock") ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await nuevoProduct(form);
       const params = new URLSearchParams(location.search);
       const volver = params.get("redirectTo");

      
      if (volver) {
      navigate(`${volver}?equipoPartePago=${encodeURIComponent(nombre)}`);
    } else {
      navigate("/productos");
    }

    } catch (err) {
      console.error("Error al agregar producto:", err);
      alert("Ocurrió un error al guardar el producto.");
    }
    
    

  };

  return (
    <div style={{ padding: 24 }}>
      <form onSubmit={handleSubmit} className="form-container">
        <h2>Nuevo Producto</h2>

        <label>
          Nombre:
          <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />
        </label>

        <label>
          Descripción:
          <input type="text" name="descripcion" value={form.descripcion} onChange={handleChange} />
        </label>

        <label>
          Precio Costo:
          <input type="number" name="precioCosto" value={form.precioCosto} onChange={handleChange} required />
        </label>

        <label>
          Precio Venta:
          <input type="number" name="precioVenta" value={form.precioVenta} onChange={handleChange} required />
        </label>

        <label>
          Stock Actual:
          <input type="number" name="stockActual" value={form.stockActual} onChange={handleChange} required />
        </label>

        <label>
          Stock Mínimo:
          <input type="number" name="stockMinimo" value={form.stockMinimo} onChange={handleChange} required />
        </label>
        
          

        <label>
          Categoría:
          <select name="idCategoria" value={form.idCategoria} onChange={handleChange} required>
            <option value="">Seleccione una categoría</option>
            {categorias.map((cat) => (
              <option key={cat.idCategoria} value={cat.idCategoria}>{cat.nombre}</option>
            ))}
          </select>
        </label>

        <button type="submit">Guardar</button>
      </form>
    </div>
  );
}
