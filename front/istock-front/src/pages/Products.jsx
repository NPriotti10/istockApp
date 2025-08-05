import React, { useEffect, useState } from "react";
import { getAllProducts } from "../services/products"; 
import { getDolarValue } from "../services/dolar"
import { Link } from "react-router-dom";
import { deleteProduct } from "../services/products";
import { getAllCategorias } from "../services/categorias";

export default function Products() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    getAllProducts()
      .then(data => {
        setProducts(data);
      })
      .catch(err => {
        console.error("Error al obtener productos:", err);
      });

      getDolarValue()
      .then((valorApi) => {
        setDolar(valorApi);
        setNuevoDolar(valorApi);
      })
      .catch((err) => {
        console.error("Error al obtener el dólar:", err);
      });

      getAllCategorias()
      .then(setCategorias)
      .catch(() => alert("Error al obtener categorías"));
  }, []);

  const [dolar, setDolar] = useState(1); // valor inicial
  const [nuevoDolar, setNuevoDolar] = useState(1); // input temporal

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categorias, setCategorias] = useState([]);
  const productosFiltrados = products.filter((prod) => {
    const coincideNombre = prod.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideCategoria =
      selectedCategory === "" || prod.idCategoria === Number(selectedCategory);
    return coincideNombre && coincideCategoria;
  });

  return (
    
    <div className="body-bg" style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ marginRight: 8 }}>Valor del dólar (USD → ARS):</label>
          <input
            type="number"
            value={nuevoDolar}
            onChange={(e) => setNuevoDolar(e.target.value)}
            style={{ width: 100, marginRight: 8 }}
          />
          <button onClick={() => setDolar(Number(nuevoDolar))}>
            Actualizar
          </button>        
        </div>
      

      <div className="products-header">
        
        <div className="products-title">Productos</div>
        <Link to="/productos/nuevo" className="add-product-btn">
            + Nuevo Producto
        </Link>
        
      </div>
      {/* 🔍 Buscador y filtro */}
      <div style={{ display: "", gap: 12, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: 6, flex: 1 }}
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: 6 }}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat.idCategoria} value={cat.idCategoria}>
              {cat.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Precio Costo</th>
              <th>Precio Venta USD</th>
              <th>Precio Venta ARS</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 18 }}>Sin productos</td>
              </tr>
            ) : (
              productosFiltrados.map((prod, idx) => (
                <tr key={prod.id || idx}>
                  <td>{idx + 1}</td>
                  <td>{prod.nombre}</td>
                  <td>{prod.descripcion}</td>
                  <td>{prod.categoria.nombre}</td>

                  <td>{prod.stockActual}</td>
                  <td>${prod.precioCosto}</td>
                  <td>${prod.precioVenta}</td>
                  <td>
                    ${Math.round(prod.precioVenta * dolar)}                 
                  </td>
                  
                  <td>
                    <Link to={`/productos/editar/${prod.idProducto}`} className="action-btn edit">
                      Editar
                    </Link>
                    <button
                      className="action-btn delete"
                      onClick={() => {
                        if (confirm("¿Estás seguro de eliminar este producto?")) {
                          deleteProduct(prod.idProducto)
                            .then(() => setProducts(products.filter(p => p.idProducto !== prod.idProducto)))
                            .catch(err => console.error("Error al eliminar:", err));
                        }
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
