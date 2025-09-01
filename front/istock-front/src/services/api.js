// src/services/api.js
import axios from "axios";

const BASE_URL = import.meta?.env?.VITE_API_URL || "https://istockapp.netlify.app/";

// 👉 Cliente normal (agrega Bearer salvo /auth/*)
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // Normalizá el path final para detectar /auth robustamente
  let path = "";
  try {
    path = new URL(config.url ?? "", api.defaults.baseURL).pathname; // p.ej. /api/auth/login
  } catch {
    path = config.url ?? "";
  }
  const isAuth = /\/auth(\/|$)/i.test(path);

  if (token && !isAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// 👉 Cliente de AUTH (NUNCA manda Authorization)
const authApi = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

export { authApi };
export default api;
