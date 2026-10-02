'use server';

export interface WeatherEstimate {
  is_forecast: boolean;
  avg_high_c: number;
  avg_low_c: number;
  avg_precipitation_mm: number;
  source: 'open-meteo';
  fetched_at: string;
}

interface GeocodeResult {
  lat: number;
  lon: number;
  name: string;
  country: string;
}

interface OpenMeteoDaily {
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

const FORECAST_WINDOW_DAYS = 16;
const HISTORICAL_YEARS_BACK = 3;

/** Geocodifica un destino a coordenadas — Open-Meteo Geocoding, gratis, sin API key. */
export async function geocodeDestination(query: string): Promise<GeocodeResult | null> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=es`,
    { cache: 'no-store' },
  );
  if (!res.ok) return null;

  const data = (await res.json()) as {
    results?: Array<{ latitude: number; longitude: number; name: string; country: string }>;
  };
  const first = data.results?.[0];
  if (!first) return null;

  return { lat: first.latitude, lon: first.longitude, name: first.name, country: first.country };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function average(nums: number[]): number {
  return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

/**
 * Estima clima para las fechas del viaje (§1.3 de docs/modules/mod-18-wanderfinance.md).
 * ≤16 días: pronóstico real. Más lejos: promedio histórico de los mismos
 * días calendario en los últimos 3 años — un "pronóstico" a meses de
 * distancia no existe, pero el promedio de esa época del año sí ayuda a
 * planear de verdad.
 */
export async function getWeatherEstimate(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
): Promise<WeatherEstimate | null> {
  const today = new Date();
  const start = new Date(startDate);
  const daysUntilTrip = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilTrip >= 0 && daysUntilTrip <= FORECAST_WINDOW_DAYS) {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=${FORECAST_WINDOW_DAYS}&timezone=auto`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as OpenMeteoDaily;
    if (!data.daily) return null;

    // Solo los días que caen dentro del rango del viaje.
    const indices = data.daily.time
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => d >= startDate && d <= endDate)
      .map(({ i }) => i);
    if (indices.length === 0) return null;

    return {
      is_forecast: true,
      avg_high_c: round1(average(indices.map((i) => data.daily!.temperature_2m_max[i]!))),
      avg_low_c: round1(average(indices.map((i) => data.daily!.temperature_2m_min[i]!))),
      avg_precipitation_mm: round1(average(indices.map((i) => data.daily!.precipitation_sum[i]!))),
      source: 'open-meteo',
      fetched_at: new Date().toISOString(),
    };
  }

  // Promedio histórico: mismos días calendario, últimos N años completos.
  const startMonthDay = startDate.slice(5);
  const endMonthDay = endDate.slice(5);
  const currentYear = today.getFullYear();

  const yearRequests = Array.from({ length: HISTORICAL_YEARS_BACK }, (_, i) => {
    const year = currentYear - 1 - i;
    // Si el viaje cruza fin de año (ej. dic → ene), el rango histórico
    // simplificado solo cubre el mismo año calendario del inicio.
    const hStart = `${year}-${startMonthDay}`;
    const hEnd = endMonthDay >= startMonthDay ? `${year}-${endMonthDay}` : `${year + 1}-${endMonthDay}`;
    return fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${hStart}&end_date=${hEnd}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`,
      { cache: 'no-store' },
    ).then((r) => (r.ok ? (r.json() as Promise<OpenMeteoDaily>) : null));
  });

  const results = (await Promise.all(yearRequests)).filter((r): r is OpenMeteoDaily => !!r?.daily);
  if (results.length === 0) return null;

  const allHighs = results.flatMap((r) => r.daily!.temperature_2m_max);
  const allLows = results.flatMap((r) => r.daily!.temperature_2m_min);
  const allPrecip = results.flatMap((r) => r.daily!.precipitation_sum);

  return {
    is_forecast: false,
    avg_high_c: round1(average(allHighs)),
    avg_low_c: round1(average(allLows)),
    avg_precipitation_mm: round1(average(allPrecip)),
    source: 'open-meteo',
    fetched_at: new Date().toISOString(),
  };
}
