import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <nav className="sidebar" style={{ fontSize: 14 }}>
      <div className="sidebar-title">iStockApp</div>
      <NavLink to="/" end className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
        Home
      </NavLink>
      <NavLink to="/productos" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
        Productos
      </NavLink>
      <NavLink to="/ventas" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
        Ventas
      </NavLink>
      <NavLink to="/compras" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
        Compras
      </NavLink>
      <NavLink to="/gastos" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
        Gastos Mensuales
      </NavLink>
      
      {/* Agregá más links según tus páginas */}
      <div className="sidebar-footer">
        <span>Prio - 2025</span>
      </div>
    </nav>
  );
}