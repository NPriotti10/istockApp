import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById, updateProduct } from "../services/products";
import { getAllCategorias } from "../services/categorias";

export default function EditProduct() {
  const { id } = useParams(); // ID del producto desde la URL
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    // Traer datos del producto
    getProductById(id)
      .then(setProduct)
      .catch((err) => {
        console.error("Error al obtener producto:", err);
        alert("No se pudo cargar el producto");
      });

    // Traer categorías
    getAllCategorias()
      .then(setCategorias)
      .catch(() => alert("Error al obtener categorías"));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: name.includes("Stock") || name.includes("Precio") ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProduct(id, product);
      alert("Producto actualizado correctamente");
      navigate("/productos");
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      alert("Error al actualizar producto");
    }
  };

  if (!product) return <p>Cargando producto...</p>;

  return (
    <div className="form-container">
        <h2>Editar producto</h2>
        <form onSubmit={handleSubmit}>
        <label>
            Nombre:
            <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={product.nombre}
            onChange={handleChange}
            required
            />
        </label>

        <label>
            Descripción:
            <input
            name="descripcion"
            placeholder="Descripción"
            value={product.descripcion}
            onChange={handleChange}
            />
        </label>

        <label>
            Precio Costo (USD):
            <input
            type="number"
            name="precioCosto"
            placeholder="Precio Costo"
            value={product.precioCosto}
            onChange={handleChange}
            required
            />
        </label>

        <label>
            Precio Venta (USD):
            <input
            type="number"
            name="precioVenta"
            placeholder="Precio Venta"
            value={product.precioVenta}
            onChange={handleChange}
            required
            />
        </label>

        <label>
            Stock Actual:
            <input
            type="number"
            name="stockActual"
            placeholder="Stock Actual"
            value={product.stockActual}
            onChange={handleChange}
            />
        </label>

        <label>
            Stock Mínimo:
            <input
            type="number"
            name="stockMinimo"
            placeholder="Stock Mínimo"
            value={product.stockMinimo}
            onChange={handleChange}
            />
        </label>

        <label>
            Categoría:
            <select
            name="idCategoria"
            value={product.idCategoria}
            onChange={handleChange}
            required
            >
            <option value="">Seleccionar categoría</option>
            {categorias.map((cat) => (
                <option key={cat.idCategoria} value={cat.idCategoria}>
                {cat.nombre}
                </option>
            ))}
            </select>
        </label>

        <button type="submit">Guardar cambios</button>
        </form>
    </div>
  );
}
