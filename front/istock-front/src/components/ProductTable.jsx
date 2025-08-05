// src/components/ProductTable.jsx
import React from "react";

export default function ProductTable({ products }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100 text-gray-700 text-left">
            <th className="py-2 px-4">#</th>
            <th className="py-2 px-4">Nombre</th>
            <th className="py-2 px-4">Descripción</th>
            <th className="py-2 px-4">Categoría</th>
            <th className="py-2 px-4">Stock</th>
            <th className="py-2 px-4">Precio Costo</th>
            <th className="py-2 px-4">Precio Venta</th>
            <th className="py-2 px-4">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-4">Sin productos</td>
            </tr>
          ) : (
            products.map((prod, idx) => (
              <tr key={prod.id || idx} className="border-t">
                <td className="py-2 px-4">{idx + 1}</td>
                <td className="py-2 px-4">{prod.codigo || prod.codigoBarras}</td>
                <td className="py-2 px-4">{prod.descripcion}</td>
                <td className="py-2 px-4">{prod.categoriaNombre || prod.categoria || "-"}</td>
                <td className="py-2 px-4">{prod.stock}</td>
                <td className="py-2 px-4">${prod.precioVenta}</td>
                <td className="py-2 px-4">
                  {/* Agregá acá botones para editar/eliminar si querés */}
                  <button className="text-blue-600 hover:underline mr-2">Editar</button>
                  <button className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
