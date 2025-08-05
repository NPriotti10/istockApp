import axios from "axios";

export const getDolarValue = async () => {
  const res = await axios.get("https://api.bluelytics.com.ar/v2/latest");
  return res.data.blue.value_avg; // Esto trae el valor promedio del dólar blue
};
