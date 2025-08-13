import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Products from "./pages/Products";
import AddProducts from "./pages/AddProducts";
import "./styles/index.css";
import EditProduct from "./pages/EditProduct";
import Sales from "./pages/Sales";
import AddSale from "./pages/AddSale";
import EditSale from "./pages/EditSale";
import SaleDetail from "./pages/SaleDetail";
import VentasPorPeriodo from "./pages/VentasPorPeriodo";
import GastosFijos from "./pages/GastosFijos";
import AddPurchase from "./pages/AddPurchase";
import Purchase from "./pages/Purchase";
import EditPurchase from "./pages/EditPurchase";
import PurchaseDetail from "./pages/PurchaseDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Sidebar />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<Products />} />
          <Route path="/productos/nuevo" element={<AddProducts />} />
          <Route path="/productos/editar/:id" element={<EditProduct />} />
          <Route path="/ventas" element={<Sales />} />
          <Route path="/ventas/nueva" element={<AddSale/>} />
          <Route path="/ventas/editar/:id" element={<EditSale/>} />
          <Route path="/ventas/detalle/:id" element={<SaleDetail/>} />
          <Route path="/ventas/:periodo" element={<VentasPorPeriodo />} />
          <Route path="/gastos" element={<GastosFijos />} />
          <Route path="/compras" element={<Purchase />} />
          <Route path="/compras/nueva" element={<AddPurchase />} />
          <Route path="/compras/editar/:id" element={<EditPurchase />} />
          <Route path="/compras/detalle/:id" element={<PurchaseDetail />} />
        
        </Routes>
      </div>
    </BrowserRouter>
  );
}
