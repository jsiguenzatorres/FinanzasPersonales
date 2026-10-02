import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { geocodeDestination, getWeatherEstimate } from './weather';

function mockFetchOnce(body: unknown, ok = true) {
  return vi.fn().mockResolvedValueOnce({
    ok,
    json: () => Promise.resolve(body),
  });
}

describe('geocodeDestination', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns lat/lon from the first result', async () => {
    global.fetch = mockFetchOnce({
      results: [{ latitude: 13.69, longitude: -89.19, name: 'San Salvador', country: 'El Salvador' }],
    }) as unknown as typeof fetch;

    const result = await geocodeDestination('San Salvador');
    expect(result).toEqual({ lat: 13.69, lon: -89.19, name: 'San Salvador', country: 'El Salvador' });
  });

  it('returns null when there are no results', async () => {
    global.fetch = mockFetchOnce({ results: [] }) as unknown as typeof fetch;
    const result = await geocodeDestination('Lugar inexistente xyz');
    expect(result).toBeNull();
  });

  it('returns null on a failed response', async () => {
    global.fetch = mockFetchOnce({}, false) as unknown as typeof fetch;
    const result = await geocodeDestination('San Salvador');
    expect(result).toBeNull();
  });
});

describe('getWeatherEstimate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('uses the real forecast when the trip starts within 16 days', async () => {
    vi.setSystemTime(new Date('2026-10-01T00:00:00Z'));
    global.fetch = mockFetchOnce({
      daily: {
        time: ['2026-10-05', '2026-10-06', '2026-10-07'],
        temperature_2m_max: [32, 34, 30],
        temperature_2m_min: [22, 24, 20],
        precipitation_sum: [0, 5, 10],
      },
    }) as unknown as typeof fetch;

    const result = await getWeatherEstimate(13.69, -89.19, '2026-10-05', '2026-10-06');

    expect(result?.is_forecast).toBe(true);
    expect(result?.avg_high_c).toBe(33); // promedio de 32 y 34 (07 queda fuera del rango)
    expect(result?.avg_low_c).toBe(23);
    expect(result?.avg_precipitation_mm).toBe(2.5);
  });

  it('falls back to historical averages when the trip is more than 16 days away', async () => {
    vi.setSystemTime(new Date('2026-10-01T00:00:00Z'));
    const historicalResponse = {
      daily: {
        time: ['x'],
        temperature_2m_max: [30],
        temperature_2m_min: [20],
        precipitation_sum: [1],
      },
    };
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(historicalResponse) }) as unknown as typeof fetch;

    const result = await getWeatherEstimate(13.69, -89.19, '2027-03-01', '2027-03-05');

    expect(result?.is_forecast).toBe(false);
    expect(result?.avg_high_c).toBe(30);
    expect(result?.avg_low_c).toBe(20);
    expect(global.fetch).toHaveBeenCalledTimes(3); // 3 años hacia atrás
  });

  it('returns null when the forecast API fails', async () => {
    vi.setSystemTime(new Date('2026-10-01T00:00:00Z'));
    global.fetch = mockFetchOnce({}, false) as unknown as typeof fetch;
    const result = await getWeatherEstimate(13.69, -89.19, '2026-10-05', '2026-10-06');
    expect(result).toBeNull();
  });
});
