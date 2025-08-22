import axios from "axios";

export const getDolarValue = async () => {
  // Lee el offset de .env y asegúrate de parsearlo como número
  const raw = import.meta.env.VITE_DOLAR_OFFSET;
  const offset = Number(String(raw ?? "0").trim()) || 0;

  try {
    const { data } = await axios.get("https://api.bluelytics.com.ar/v2/latest");
    const apiVal = Number(data?.blue?.value_avg) || 0;
    return apiVal + offset;
  } catch (e) {
    console.warn("No se pudo leer el dólar de la API, usando solo offset:", e?.message);
    // Si falla la API, al menos devolvé el offset (no 0)
    return offset;
  }
};
