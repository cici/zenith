import axios, { AxiosError } from 'axios';

const API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Simple in-memory cache
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Simple rate limiter (max 60 requests/minute)
let requestCount = 0;
let lastReset = Date.now();
const RATE_LIMIT = 60;
const RATE_WINDOW = 60 * 1000;

function rateLimit() {
  const now = Date.now();
  if (now - lastReset > RATE_WINDOW) {
    requestCount = 0;
    lastReset = now;
  }
  if (requestCount >= RATE_LIMIT) {
    throw new Error('Rate limit exceeded for OpenWeatherMap API');
  }
  requestCount++;
}

function getCacheKey(endpoint: string, params: Record<string, any>) {
  return `${endpoint}:${JSON.stringify(params)}`;
}

async function fetchWithCache(endpoint: string, params: Record<string, any>) {
  const cacheKey = getCacheKey(endpoint, params);
  const cached = cache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiry > now) {
    return cached.data;
  }
  rateLimit();
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      params: { ...params, appid: API_KEY, units: 'metric' },
    });
    cache.set(cacheKey, { data: response.data, expiry: now + CACHE_TTL });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const err = error as AxiosError;
      if (err.response) {
        throw new Error(`OpenWeatherMap API error: ${err.response.status} ${err.response.statusText}`);
      } else if (err.request) {
        throw new Error('No response from OpenWeatherMap API');
      } else {
        throw new Error(`Request error: ${err.message}`);
      }
    } else {
      throw error;
    }
  }
}

export async function getCurrentWeather(location: string | { lat: number; lon: number }) {
  let params: Record<string, any> = {};
  if (typeof location === 'string') {
    params.q = location;
  } else {
    params.lat = location.lat;
    params.lon = location.lon;
  }
  return fetchWithCache('/weather', params);
}

export async function getHourlyForecast(location: string | { lat: number; lon: number }) {
  let params: Record<string, any> = {};
  if (typeof location === 'string') {
    params.q = location;
  } else {
    params.lat = location.lat;
    params.lon = location.lon;
  }
  return fetchWithCache('/forecast', params);
}

export async function getDailyForecast(location: { lat: number; lon: number }) {
  // OpenWeatherMap's One Call API (for daily) requires coordinates
  return fetchWithCache('/onecall', {
    lat: location.lat,
    lon: location.lon,
    exclude: 'minutely,hourly',
  });
} 