import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Products from "../pages/Products";
import AddProduct from "../pages/AddProducts";
import Sales from "../pages/Sales";
import AddSale from "../pages/AddSale";
import EditSale from "../pages/EditSale";
import SaleDetail from "../pages/SaleDetail";
import VentasPorPeriodo from "../pages/VentasPorPeriodo";


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

      {/* 
      <Route path="/productos/editar/:id" element={<EditProduct />} />
      
      <Route path="/ventas/nueva" element={<AddSale />} />
      <Route path="/compras" element={<Purchases />} />
      <Route path="/compras/nueva" element={<AddPurchase />} />
      <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}
