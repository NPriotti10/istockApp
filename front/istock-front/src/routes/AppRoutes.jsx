import { Routes, Route, Navigate } from "react-router-dom";

// Páginas
import Home from "../pages/Home";
import Products from "../pages/Products";
import AddProduct from "../pages/AddProducts";
import EditProduct from "../pages/EditProduct";

import Sales from "../pages/Sales";
import AddSale from "../pages/AddSale";
import EditSale from "../pages/EditSale";
import SaleDetail from "../pages/SaleDetail";
import VentasPorPeriodo from "../pages/VentasPorPeriodo";

import GastosFijos from "../pages/GastosFijos";

import Purchase from "../pages/Purchase";
import AddPurchase from "../pages/AddPurchase";
import EditPurchase from "../pages/EditPurchase";
import PurchaseDetail from "../pages/PurchaseDetail";

import Login from "../pages/Login";

import PrivateRoute from "./PrivateRoute";
import ProtectedLayout from "../layouts/ProtectedLayout";

import Categories from "../pages/Categories";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/login" element={<Login />} />

      {/* Todas las privadas cuelgan de un layout con Sidebar */}
      <Route
        element={
          <PrivateRoute>
            <ProtectedLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Home />} /> {/* "/" */}
        <Route path="/productos" element={<Products />} />
        <Route path="/productos/nuevo" element={<AddProduct />} />
        <Route path="/productos/editar/:id" element={<EditProduct />} />

        <Route path="/ventas" element={<Sales />} />
        <Route path="/ventas/nueva" element={<AddSale />} />
        <Route path="/ventas/editar/:id" element={<EditSale />} />
        <Route path="/ventas/detalle/:id" element={<SaleDetail />} />
        <Route path="/ventas/periodo/:periodo" element={<VentasPorPeriodo />} />

        <Route path="/gastos" element={<GastosFijos />} />

        {/* Compras en plural (coincide con tus Links) */}
        <Route path="/compras" element={<Purchase />} />
        <Route path="/compras/nueva" element={<AddPurchase />} />
        <Route path="/compras/editar/:id" element={<EditPurchase />} />
        <Route path="/compras/detalle/:id" element={<PurchaseDetail />} />
        
        <Route path="/categorias" element={<Categories />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
