// src/utils/format.js

// Formatea números con separador de miles usando locale es-AR
const nfNumber = new Intl.NumberFormat("es-AR");

// Monedas
const nfUSD = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});
const nfARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

// $12.345,67 (USD)
export function moneyUSD(n) {
  if (n == null || Number.isNaN(Number(n))) return "-";
  return nfUSD.format(Number(n));
}

// $12.345,67 (ARS)
export function moneyARS(n) {
  if (n == null || Number.isNaN(Number(n))) return "-";
  return nfARS.format(Number(n));
}

// 12.345 (solo miles, sin símbolo)
export function withThousands(n) {
  if (n == null || Number.isNaN(Number(n))) return "-";
  return nfNumber.format(Number(n));
}
