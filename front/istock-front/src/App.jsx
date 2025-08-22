// src/App.jsx
import "./styles/index.css";
import Sidebar from "./components/Sidebar";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-content">
        <AppRoutes />
      </main>
    </div>
  );
}
