import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:7063/api", // Cambia esto si tu API tiene otra URL o puerto
  // Puedes agregar aquí los headers comunes o interceptores
});

export default api;
