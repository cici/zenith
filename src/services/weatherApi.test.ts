import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import * as weatherApi from './weatherApi';

vi.mock('axios');
const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn> };

const sampleWeather = { weather: [{ main: 'Clear' }], main: { temp: 20 } };
const sampleForecast = { list: [{ dt: 1, main: { temp: 21 } }] };
const sampleDaily = { daily: [{ dt: 1, temp: { day: 22 } }] };

describe('weatherApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset internal cache and rate limit
    (weatherApi as any).cache?.clear?.();
    (weatherApi as any).requestCount = 0;
    (weatherApi as any).lastReset = Date.now();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches current weather by city name', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: sampleWeather });
    const data = await weatherApi.getCurrentWeather('London');
    expect(data).toEqual(sampleWeather);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/weather'),
      expect.objectContaining({ params: expect.objectContaining({ q: 'London' }) })
    );
  });

  it('fetches current weather by coordinates', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: sampleWeather });
    const data = await weatherApi.getCurrentWeather({ lat: 51.5, lon: -0.1 });
    expect(data).toEqual(sampleWeather);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/weather'),
      expect.objectContaining({ params: expect.objectContaining({ lat: 51.5, lon: -0.1 }) })
    );
  });

  it('fetches hourly forecast', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: sampleForecast });
    const data = await weatherApi.getHourlyForecast('London');
    expect(data).toEqual(sampleForecast);
  });

  it('fetches daily forecast', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: sampleDaily });
    const data = await weatherApi.getDailyForecast({ lat: 51.5, lon: -0.1 });
    expect(data).toEqual(sampleDaily);
  });

  it('caches API responses', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: sampleWeather });
    await weatherApi.getCurrentWeather('London');
    await weatherApi.getCurrentWeather('London');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Second call is cached
  });

  it('throws on API error response', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, statusText: 'Unauthorized' },
    });
    await expect(weatherApi.getCurrentWeather('London')).rejects.toThrow('OpenWeatherMap API error: 401 Unauthorized');
  });

  it('throws on network error', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue({
      isAxiosError: true,
      request: {},
    });
    await expect(weatherApi.getCurrentWeather('London')).rejects.toThrow('No response from OpenWeatherMap API');
  });

  it('throws on request error', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue({
      isAxiosError: true,
      message: 'Something went wrong',
    });
    await expect(weatherApi.getCurrentWeather('London')).rejects.toThrow('Request error: Something went wrong');
  });

  it('throws on rate limit exceeded', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: sampleWeather });
    (weatherApi as any).requestCount = 60;
    await expect(weatherApi.getCurrentWeather('London')).rejects.toThrow('Rate limit exceeded for OpenWeatherMap API');
  });
}); 