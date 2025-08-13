import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css"; // Asegúrate de importar Tailwind
import { DolarProvider } from "./context/DolarContext"; // Importa el proveedor del contexto

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DolarProvider> 
    <App />
    </DolarProvider>
  </React.StrictMode>
);
