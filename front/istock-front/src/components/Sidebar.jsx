import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-title">iStock</div>
      <NavLink to="/" end className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
        Home
      </NavLink>
      <NavLink to="/productos" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
        Productos
      </NavLink>
      <NavLink to="/ventas" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
        Ventas
      </NavLink>
      
      {/* Agregá más links según tus páginas */}
      <div className="sidebar-footer">
        <span>by Nico · 2025</span>
      </div>
    </nav>
  );
}
