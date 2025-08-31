import { useNavigate, useLocation } from "react-router-dom";
import { useGlobalScanner } from "../hooks/useGlobalScanner";

export default function GlobalScanner({ enabled = true }) {
  const navigate = useNavigate();
  const location = useLocation();

  useGlobalScanner(
    (code) => {
      if (location.pathname.startsWith("/ventas/nueva")) {
        // ya estamos en la pantalla → enviamos el código
        window.dispatchEvent(new CustomEvent("global-scan", { detail: { code } }));
      } else {
        // en cualquier otra ruta → ir a nueva venta con el código en la URL
        navigate(`/ventas/nueva?code=${encodeURIComponent(code)}`);
      }
    },
    { enabled }
  );

  return null; // sin UI
}
