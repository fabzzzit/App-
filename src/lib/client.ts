export function getClientId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("mentorchess-client");
  if (!id) {
    id =
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem("mentorchess-client", id);
  }
  return id;
}

export const THINK_TIPS = [
  "¿Qué quiere hacer mi rival con su última jugada?",
  "Revisa: Jaques, Capturas, Amenazas — en ese orden.",
  "¿Alguna de mis piezas quedó sin protección?",
  "Controla el centro, desarrolla piezas y enroca.",
  "No muevas la misma pieza dos veces en la apertura sin motivo.",
  "Antes de capturar, comprueba si te pueden recapturar.",
  "Si vas ganando, cambia piezas. Si vas perdiendo, complica.",
  "Un mal plan es mejor que ningún plan: mejora tu peor pieza.",
];
