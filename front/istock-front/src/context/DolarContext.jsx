import { createContext, useContext, useState, useEffect } from "react";
import { getDolarValue } from "../services/dolar"; // Asegurate de que esta ruta esté bien

// Crear el contexto
const DolarContext = createContext();

// Hook personalizado para usar el contexto
export function useDolar() {
  return useContext(DolarContext);
}

// Proveedor del contexto
export function DolarProvider({ children }) {
  const [dolar, setDolar] = useState(1);

  useEffect(() => {
    getDolarValue()
      .then((valor) => setDolar(valor))
      .catch(() => {
        console.warn("No se pudo obtener el valor del dólar");
        setDolar(1);
      });
  }, []);

  const value = { dolar, setDolar };

  return (
    <DolarContext.Provider value={value}>
      {children}
    </DolarContext.Provider>
  );
}
