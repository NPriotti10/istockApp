// src/services/auth.js
import api, { authApi } from "./api";

export async function login(username, password) {
  // Evitá tokens viejos
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  const { data } = await authApi.post("/auth/login", {
    username: username?.trim(),
    password: password?.trim(),
  });

  localStorage.setItem("token", data.token);
  if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
  return data.user ?? null;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
