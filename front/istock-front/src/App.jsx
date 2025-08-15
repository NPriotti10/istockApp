import { Routes, Route, Navigate } from "react-router-dom";
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
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <AppRoutes />    
  );
}
