import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPurchaseById, updatePurchase } from "../services/purchases";

export default function EditPurchase() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [purchase, setPurchase] = useState(null);

  useEffect(() => {
    getPurchaseById(id)
      .then(setPurchase)
      .catch((err) => {
        console.error("Error al obtener compra:", err);
        alert("No se pudo cargar la compra");
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPurchase((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const confirmar = confirm("¿Estás seguro de guardar los cambios?");
    if (!confirmar) return;

    try {
      await updatePurchase(id, purchase);
      alert("✅ Compra actualizada correctamente");
      navigate("/compras");
    } catch (error) {
      console.error("Error al actualizar compra:", error);
      alert("❌ Error al actualizar compra");
    }
  };

  if (!compra) return <p style={{ padding: 24 }}>Cargando compra...</p>;

  const container = {
  padding: "24px",
  maxWidth: "600px",
  margin: "0 auto",
  background: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const formGroup = {
  display: "flex",
  flexDirection: "column",
};

const label = {
  fontWeight: "600",
  marginBottom: "6px",
  fontSize: "14px",
  color: "#374151",
};

const input = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "16px",
  outline: "none",
  transition: "border 0.2s",
};

const button = {
  padding: "12px",
  background: "#2563eb",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer",
  marginTop: "10px",
};


  return (
    <div style={container}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Editar Compra</h2>
      <form onSubmit={handleSubmit}>
        <div style={formGroup}>
          <label style={label}>Proveedor:</label>
          <input
            type="text"
            name="proveedor"
            placeholder="Nombre del proveedor"
            value={sale.cliente}
            onChange={handleChange}
            style={input}
            required
          />
        </div>

        

        <div style={formGroup}>
          <label style={label}>Fecha:</label>
          <input
            type="date"
            name="fecha"
            value={compra.fecha?.split("T")[0] || ""}
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
