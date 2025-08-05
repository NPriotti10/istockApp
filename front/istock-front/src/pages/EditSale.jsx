import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSaleById, updateSale } from "../services/sales";

export default function EditSale() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sale, setSale] = useState(null);

  useEffect(() => {
    getSaleById(id)
      .then(setSale)
      .catch((err) => {
        console.error("Error al obtener venta:", err);
        alert("No se pudo cargar la venta");
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSale((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const confirmar = confirm("¿Estás seguro de guardar los cambios?");
    if (!confirmar) return;

    try {
      await updateSale(id, sale);
      alert("✅ Venta actualizada correctamente");
      navigate("/ventas");
    } catch (error) {
      console.error("Error al actualizar venta:", error);
      alert("❌ Error al actualizar venta");
    }
  };

  if (!sale) return <p style={{ padding: 24 }}>Cargando venta...</p>;

  // 🎨 Estilos inline para mantener consistencia visual
  const container = {
    padding: 24,
    maxWidth: 500,
    margin: "0 auto",
    background: "#f9f9f9",
    borderRadius: 12,
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  };

  const formGroup = {
    marginBottom: 16,
    display: "flex",
    flexDirection: "column",
  };

  const label = {
    fontWeight: "bold",
    marginBottom: 4,
  };

  const input = {
    padding: 8,
    border: "1px solid #ccc",
    borderRadius: 6,
  };

  const button = {
    padding: "10px 16px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
  };

  return (
    <div style={container}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Editar Venta</h2>
      <form onSubmit={handleSubmit}>
        <div style={formGroup}>
          <label style={label}>Cliente:</label>
          <input
            type="text"
            name="cliente"
            placeholder="Nombre del cliente"
            value={sale.cliente}
            onChange={handleChange}
            style={input}
            required
          />
        </div>

        <div style={formGroup}>
          <label style={label}>Forma de Pago:</label>
          <input
            type="text"
            name="formaPago"
            placeholder="Forma de pago"
            value={sale.formaPago || ""}
            onChange={handleChange}
            style={input}
          />
        </div>

        <div style={formGroup}>
          <label style={label}>Equipo parte de pago:</label>
          <input
            type="text"
            name="equipoPartePago"
            placeholder="Equipo entregado como parte de pago"
            value={sale.equipoPartePago || ""}
            onChange={handleChange}
            style={input}
          />
        </div>

        <div style={formGroup}>
          <label style={label}>Valor del dólar:</label>
          <input
            type="number"
            name="valorDolar"
            value={sale.valorDolar || ""}
            onChange={handleChange}
            style={input}
          />
        </div>

        <div style={formGroup}>
          <label style={label}>Fecha:</label>
          <input
            type="date"
            name="fecha"
            value={sale.fecha?.split("T")[0] || ""}
            onChange={handleChange}
            style={input}
            required
          />
        </div>

        <button type="submit" style={button}>
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
