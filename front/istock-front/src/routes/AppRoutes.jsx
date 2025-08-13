import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Products from "../pages/Products";
import AddProduct from "../pages/AddProducts";
import Sales from "../pages/Sales";
import AddSale from "../pages/AddSale";
import EditSale from "../pages/EditSale";
import SaleDetail from "../pages/SaleDetail";
import VentasPorPeriodo from "../pages/VentasPorPeriodo";
import GastosFijos from "../pages/GastosFijos";
import AddPurchase from "../pages/AddPurchase";
import Purchase from "../pages/Purchase";
import EditPurchase from "../pages/EditPurchase";
import PurchaseDetail from "../pages/PurchaseDetail";



export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/productos" element={<Products />} />
      <Route path="/productos/nuevo" element={<AddProduct />} />
      <Route path="/ventas" element={<Sales />} />
      <Route path="/ventas/nueva" element={<AddSale />} />
      <Route path="/ventas/editar/:id" element={<EditSale />} />
      <Route path="/ventas/detalle/:id" element={<SaleDetail />} />
      <Route path="/ventas/periodo/:periodo" element={<VentasPorPeriodo />} />
      <Route path="/gastos" element={<GastosFijos />} />
      <Route path="/compra" element={<Purchase />} />
      <Route path="/compra/nueva" element={<AddPurchase />} />
      <Route path="/compra/editar/:id" element={<EditPurchase />} />
      <Route path="/compra/detalle/:id" element={<PurchaseDetail />} />

      {/* 
      <Route path="/productos/editar/:id" element={<EditProduct />} />
      
      <Route path="/ventas/nueva" element={<AddSale />} />
      <Route path="/compras" element={<Purchases />} />
      <Route path="/compras/nueva" element={<AddPurchase />} />
      <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}
