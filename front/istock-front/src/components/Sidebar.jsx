import React from "react";
import { NavLink, Link } from "react-router-dom";
// ✅ Importá tu logo así para que Vite lo sirva correctamente
import logo from "../img/logo.jpg.jpeg";
import { useLocation } from "react-router-dom";





export default function Sidebar() {

  const { pathname } = useLocation();

  // rutas donde NO debe mostrarse el sidebar
  const HIDE_ON = ["/login"]; // agregá más si querés: "/register", "/recuperar", etc.
  const mustHide = HIDE_ON.some((p) => pathname.startsWith(p));
  if (mustHide) return null;

  return (
    <nav className="sidebar">
      {/* Brand */}
      <Link to="/" className="sidebar__brand" aria-label="Ir a Home">
        <div className="sidebar__logoWrap">
          <img src={logo} alt="iStockApp" className="sidebar__logo" />
        </div>
        <div className="sidebar__brandMeta">
          <span className="sidebar__title">iStockApp</span>
        </div>
      </Link>

      <div className="sidebar__divider" />

      {/* Nav */}
      <div className="sidebar__nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
        >
          Home
        </NavLink>

        <NavLink
          to="/productos"
          className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
        >
          Productos
        </NavLink>

        <NavLink
          to="/ventas"
          className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
        >
          Ventas
        </NavLink>

        <NavLink
          to="/compras"
          className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
        >
          Compras
        </NavLink>

        <NavLink
          to="/gastos"
          className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
        >
          Gastos Mensuales
        </NavLink>

        <NavLink
          to="/categorias"
          className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
        >
          Categorias
        </NavLink>
      </div>

      
    </nav>
  );
}
