import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as weatherApi from '../../services/weatherApi';
import { weatherConfigSchema } from "./weatherConfigSchema";
import { WidgetConfigPanel } from "@/components/WidgetConfigPanel";
import { Settings, CloudSun } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const GEO_API = 'https://api.openweathermap.org/geo/1.0/direct';
const GEO_REVERSE_API = 'https://api.openweathermap.org/geo/1.0/reverse';
const API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;

interface Location {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  state?: string;
}

function saveLocation(location: Location) {
  localStorage.setItem('weather_location', JSON.stringify(location));
}

function getSavedLocation(): Location | null {
  const loc = localStorage.getItem('weather_location');
  return loc ? JSON.parse(loc) : null;
}

function saveFavorites(favorites: Location[]) {
  localStorage.setItem('weather_favorites', JSON.stringify(favorites));
}

function getFavorites(): Location[] {
  const favs = localStorage.getItem('weather_favorites');
  return favs ? JSON.parse(favs) : [];
}

export const WeatherWidget: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(getSavedLocation());
  const [favorites, setFavorites] = useState<Location[]>(getFavorites());
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Weather data state
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [current, setCurrent] = useState<any>(null);
  const [daily, setDaily] = useState<any[]>([]);
  const [hourly, setHourly] = useState<any[]>([]);

  // Config state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("weatherWidgetConfig") : null;
    if (saved) return JSON.parse(saved);
    const defaults: Record<string, any> = {};
    weatherConfigSchema.fields.forEach(f => (defaults[f.name] = f.default));
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem("weatherWidgetConfig", JSON.stringify(config));
  }, [config]);

  const handleConfigChange = (name: string, value: any) => {
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  // Geolocation detection
  const detectLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLoading(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        // Reverse geocode to get city name
        try {
          const res = await axios.get(GEO_REVERSE_API, {
            params: { lat, lon, limit: 1, appid: API_KEY },
          });
          if (res.data && res.data.length > 0) {
            const loc: Location = {
              name: res.data[0].name,
              lat,
              lon,
              country: res.data[0].country,
              state: res.data[0].state,
            };
            setLocation(loc);
            saveLocation(loc);
          } else {
            setError('Could not determine city name for your location');
          }
        } catch (e) {
          setError('Failed to reverse geocode location');
        }
      },
      (err) => {
        setLoading(false);
        setError('Permission denied or error getting location');
      }
    );
  };

  // Search autocomplete
  useEffect(() => {
    if (search.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    axios
      .get(GEO_API, {
        params: { q: search, limit: 5, appid: API_KEY },
      })
      .then((res) => {
        if (!cancelled) {
          setSuggestions(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search]);

  // Save location to local storage when changed
  useEffect(() => {
    if (location) saveLocation(location);
  }, [location]);

  // Save favorites to local storage when changed
  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  // Fetch weather data when location changes
  useEffect(() => {
    if (!location) return;
    setWeatherLoading(true);
    setWeatherError(null);
    setCurrent(null);
    setDaily([]);
    setHourly([]);
    (async () => {
      try {
        // Current weather
        const currentData = await weatherApi.getCurrentWeather({ lat: location.lat, lon: location.lon });
        setCurrent(currentData);
        // Daily forecast
        const dailyData = await weatherApi.getDailyForecast({ lat: location.lat, lon: location.lon });
        setDaily(dailyData.daily?.slice(0, 7) || []);
        // Hourly forecast
        const hourlyData = await weatherApi.getHourlyForecast({ lat: location.lat, lon: location.lon });
        setHourly(hourlyData.list?.slice(0, 12) || []);
      } catch (e: any) {
        setWeatherError(e.message || 'Failed to fetch weather data');
      } finally {
        setWeatherLoading(false);
      }
    })();
  }, [location]);

  useEffect(() => {
    // If no location is set, use defaultCity from config
    if (!location && config.defaultCity) {
      setLoading(true);
      axios
        .get(GEO_API, {
          params: { q: config.defaultCity, limit: 1, appid: API_KEY },
        })
        .then((res) => {
          if (res.data && res.data.length > 0) {
            const loc = {
              name: res.data[0].name,
              lat: res.data[0].lat,
              lon: res.data[0].lon,
              country: res.data[0].country,
              state: res.data[0].state,
            };
            setLocation(loc);
            saveLocation(loc);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.defaultCity]);

  const selectSuggestion = (loc: Location) => {
    setLocation(loc);
    setSuggestions([]);
    setSearch('');
  };

  const addFavorite = () => {
    if (location && !favorites.some(f => f.lat === location.lat && f.lon === location.lon)) {
      setFavorites([...favorites, location]);
    }
  };

  const removeFavorite = (loc: Location) => {
    setFavorites(favorites.filter(f => f.lat !== loc.lat || f.lon !== loc.lon));
  };

  return (
    <Card>
      <CardContent>
        {/* Unified Header Bar */}
        <div className="flex items-center justify-between w-full px-2 py-2 border-b mb-4">
          <div className="flex items-center gap-2">
            <CloudSun className="h-6 w-6 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-transparent bg-clip-text" />
            <span className="font-poppins font-semibold text-lg">Weather</span>
          </div>
          <Button variant="ghost" size="icon" aria-label="Settings" onClick={() => setIsConfigOpen(true)}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Weather Widget Settings</DialogTitle>
            </DialogHeader>
            <WidgetConfigPanel
              schema={weatherConfigSchema}
              values={config}
              onChange={handleConfigChange}
            />
            <div className="flex justify-end mt-4">
              <Button onClick={() => setIsConfigOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {error && <div className="error">{error}</div>}
        {/* Search & Location Controls */}
        <Button onClick={detectLocation} disabled={loading} className="w-full mt-2 mb-2">
          Use My Location
        </Button>
        <div className="relative w-full mb-2">
          <input
            type="text"
            placeholder="Search city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-0"
          />
          {loading && (
            <span className="absolute right-3 top-2 text-gray-400 animate-spin" aria-label="Loading" role="status">🔄</span>
          )}
          {suggestions.length > 0 && (
            <ul className="absolute z-10 bg-white rounded shadow w-full mt-1 text-left border">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  onClick={() => selectSuggestion(s)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                >
                  {s.name}, {s.state ? s.state + ', ' : ''}{s.country}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Current Location Display */}
        {location && (
          <div className="flex items-center gap-2 bg-blue-50 rounded px-3 py-1 mt-2 mb-2 w-fit">
            <span className="font-medium text-sm">{location.name}{location.state ? `, ${location.state}` : ''}, {location.country}</span>
            <Button variant="outline" size="sm" className="ml-2" onClick={addFavorite}>
              Add to Favorites
            </Button>
          </div>
        )}
        {/* Favorites Display */}
        {favorites.length > 0 && (
          <div className="flex gap-2 mt-2 mb-2 overflow-x-auto">
            {favorites.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-gray-100 rounded px-3 py-1 cursor-pointer hover:bg-blue-100"
                onClick={() => setLocation(f)}
              >
                <span className="text-sm">{f.name}{f.state ? `, ${f.state}` : ''}, {f.country}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-1"
                  aria-label="Remove favorite"
                  onClick={e => { e.stopPropagation(); removeFavorite(f); }}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Weather Data UI */}
        {location && (
          <div className="weather-data">
            <h4 className="font-semibold text-base mt-2 mb-2">Weather</h4>
            {weatherLoading && <div>Loading weather...</div>}
            {weatherError && <div className="error">{weatherError}</div>}
            {current && (
              <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center gap-2 mt-2 mb-2">
                <div className="flex flex-col items-center">
                  <img
                    src={`https://openweathermap.org/img/wn/${current.weather?.[0]?.icon}@2x.png`}
                    alt={current.weather?.[0]?.description}
                    className="w-16 h-16"
                  />
                  <span className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-transparent bg-clip-text">
                    {Math.round(current.main?.temp)}°C
                  </span>
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  <strong>{current.weather?.[0]?.main}</strong> - {current.weather?.[0]?.description}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                  <span>Humidity: {current.main?.humidity}%</span>
                  <span>Wind: {current.wind?.speed} m/s</span>
                </div>
              </div>
            )}
            {daily.length > 0 && (
              <div className="daily-forecast">
                <h5 className="font-medium text-sm mb-1">Daily Forecast</h5>
                <div className="flex gap-3 overflow-x-auto py-2">
                  {daily.map((d, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-2 flex flex-col items-center min-w-[64px] text-xs font-medium">
                      <div>{new Date(d.dt * 1000).toLocaleDateString(undefined, { weekday: 'short' })}</div>
                      <img
                        src={`https://openweathermap.org/img/wn/${d.weather?.[0]?.icon || '01d'}@2x.png`}
                        alt={d.weather?.[0]?.description || ''}
                        className="w-8 h-8"
                      />
                      <div>{Math.round(d.temp?.min)}° / {Math.round(d.temp?.max)}°</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hourly.length > 0 && (
              <div className="hourly-forecast">
                <h5 className="font-medium text-sm mb-1">Hourly Forecast</h5>
                <div className="flex gap-3 overflow-x-auto py-2">
                  {hourly.map((h, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-2 flex flex-col items-center min-w-[64px] text-xs font-medium">
                      <div>{new Date(h.dt * 1000).getHours()}:00</div>
                      <img
                        src={`https://openweathermap.org/img/wn/${h.weather?.[0]?.icon || '01d'}@2x.png`}
                        alt={h.weather?.[0]?.description || ''}
                        className="w-8 h-8"
                      />
                      <div>{Math.round(h.main?.temp)}°</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 