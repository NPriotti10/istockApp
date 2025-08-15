import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css"; // Asegúrate de importar Tailwind
import { DolarProvider } from "./context/DolarContext"; // Importa el proveedor del contexto
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <DolarProvider> 
        <App />
      </DolarProvider>
    </BrowserRouter>
  </React.StrictMode>
);
