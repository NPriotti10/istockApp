// src/services/api.js
import axios from "axios";

/**
 * BASE_URL
 * - Se toma de VITE_API_URL (Netlify / .env), por ejemplo:
 *   VITE_API_URL=https://<tu-app-service>.azurewebsites.net/api
 * - Si no está definida, usa un default con /api incluido.
 * - Quitamos barras finales para evitar // en las requests.
 */
const RAW_BASE =
  (import.meta?.env?.VITE_API_URL) ??
  "https://istockapp-api-gjhrfecvdvhhb4d3.brazilsouth-01.azurewebsites.net/api";

const BASE_URL = RAW_BASE.replace(/\/+$/, "");

// Opcional: log en desarrollo si estás usando el fallback
if (import.meta?.env?.MODE !== "production" && !import.meta?.env?.VITE_API_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    "[api] VITE_API_URL no está definida. Usando default:",
    BASE_URL
  );
}

/**
 * Cliente general (agrega Authorization: Bearer {token} en TODAS
 * menos las rutas de /auth).
 */
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // Normalizamos el path final para detectar /auth de forma robusta
  let path = "";
  try {
    // Si config.url es relativa, resuelve contra baseURL
    path = new URL(config.url ?? "", api.defaults.baseURL).pathname; // ej: /api/auth/login
  } catch {
    path = config.url ?? "";
  }

  // Detecta cualquier ruta que comience con /auth ó que sea /auth/...
  // (como estamos detrás de /api en baseURL, acá el path suele incluir /api)
  const isAuth = /\/auth(\/|$)/i.test(path.replace(/^\/api/, ""));

  if (token && !isAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

/**
 * Cliente de AUTH (NUNCA manda Authorization).
 * Úsalo para login/registro/refresh si aplica.
 */
const authApi = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: {
    Accept: "application/json",
  },
});

export { authApi };
export default api;
