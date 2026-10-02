const PREFERENCE_LABELS: Record<string, string> = {
  playas: 'playas',
  naturaleza: 'naturaleza y aire libre',
  museos_cultura: 'museos y cultura',
  gastronomia: 'gastronomía local',
  vida_nocturna: 'vida nocturna',
  aventura: 'aventura y deportes',
  compras: 'compras',
  relajacion: 'relajación / descanso',
};

/**
 * Prompt para Gemini con Grounding de Google Maps (MOD-18 WanderFinance) —
 * pide un itinerario día por día citando lugares REALES, no inventados.
 * Ver docs/modules/mod-18-wanderfinance.md §1.2 para la decisión de
 * proveedor (grounding vía Gemini, no APIs de Maps directas).
 */
export function buildTripItineraryPrompt(input: {
  destination: string;
  startDate: string;
  endDate: string;
  travelersCount: number;
  budget: number;
  budgetCurrency: string;
  preferences: string[];
}): string {
  const days =
    Math.round((new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / 86400000) + 1;
  const prefLabels = input.preferences.map((p) => PREFERENCE_LABELS[p] ?? p).join(', ');

  return `Eres un planificador de viajes. Genera un itinerario día por día para un viaje real a
"${input.destination}", del ${input.startDate} al ${input.endDate} (${days} días), para
${input.travelersCount} persona(s), con un presupuesto total de ${input.budget} ${input.budgetCurrency}.

Preferencias del viajero: ${prefLabels}.

Usa SOLO lugares reales y verificables (restaurantes, atracciones, zonas) — no inventes nombres de
negocios que no existen. Para cada día, sugiere 2-4 actividades/lugares concretos relacionados con las
preferencias indicadas, con una frase breve de por qué encaja. Ten en cuenta el presupuesto: no sugieras
solo opciones de lujo si el presupuesto es ajustado para la cantidad de días y viajeros.

Formato de respuesta: markdown, con un encabezado "## Día N (fecha)" por cada día y una lista de
actividades debajo. Sé conciso — máximo 4-5 líneas por día. Responde en español latino.`;
}
