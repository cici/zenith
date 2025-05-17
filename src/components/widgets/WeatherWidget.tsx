import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as weatherApi from '../../services/weatherApi';

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
    <div className="weather-widget">
      <h3>Weather Location</h3>
      {error && <div className="error">{error}</div>}
      <button onClick={detectLocation} disabled={loading}>
        Use My Location
      </button>
      <div>
        <input
          type="text"
          placeholder="Search city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {loading && (
          <span style={{ marginLeft: 8 }} aria-label="Loading" role="status">🔄</span>
        )}
        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((s, i) => (
              <li key={i} onClick={() => selectSuggestion(s)}>
                {s.name}, {s.state ? s.state + ', ' : ''}{s.country}
              </li>
            ))}
          </ul>
        )}
      </div>
      {location && (
        <div className="current-location">
          <div>
            <strong>Selected:</strong> {location.name}, {location.state ? location.state + ', ' : ''}{location.country}
          </div>
          <button onClick={addFavorite}>Add to Favorites</button>
        </div>
      )}
      {favorites.length > 0 && (
        <div className="favorites">
          <strong>Favorites:</strong>
          <ul>
            {favorites.map((f, i) => (
              <li key={i}>
                <span onClick={() => setLocation(f)} style={{ cursor: 'pointer' }}>
                  {f.name}, {f.state ? f.state + ', ' : ''}{f.country}
                </span>
                <button onClick={() => removeFavorite(f)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weather Data UI */}
      {location && (
        <div className="weather-data">
          <h4>Weather</h4>
          {weatherLoading && <div>Loading weather...</div>}
          {weatherError && <div className="error">{weatherError}</div>}
          {current && (
            <div className="current-weather">
              <div>
                <strong>{current.weather?.[0]?.main}</strong> - {current.weather?.[0]?.description}
              </div>
              <div>
                <img
                  src={`https://openweathermap.org/img/wn/${current.weather?.[0]?.icon}@2x.png`}
                  alt={current.weather?.[0]?.description}
                  style={{ verticalAlign: 'middle' }}
                />
                <span style={{ fontSize: '2em' }}>{Math.round(current.main?.temp)}°C</span>
              </div>
              <div>Humidity: {current.main?.humidity}%</div>
              <div>Wind: {current.wind?.speed} m/s</div>
            </div>
          )}
          {daily.length > 0 && (
            <div className="daily-forecast">
              <h5>Daily Forecast</h5>
              <div style={{ display: 'flex', gap: 8 }}>
                {daily.map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', minWidth: 60 }}>
                    <div>{new Date(d.dt * 1000).toLocaleDateString(undefined, { weekday: 'short' })}</div>
                    <img
                      src={`https://openweathermap.org/img/wn/${d.weather?.[0]?.icon || '01d'}@2x.png`}
                      alt={d.weather?.[0]?.description || ''}
                      width={40}
                      height={40}
                    />
                    <div>{Math.round(d.temp?.min)}° / {Math.round(d.temp?.max)}°</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {hourly.length > 0 && (
            <div className="hourly-forecast">
              <h5>Hourly Forecast</h5>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                {hourly.map((h, i) => (
                  <div key={i} style={{ textAlign: 'center', minWidth: 60 }}>
                    <div>{new Date(h.dt * 1000).getHours()}:00</div>
                    <img
                      src={`https://openweathermap.org/img/wn/${h.weather?.[0]?.icon || '01d'}@2x.png`}
                      alt={h.weather?.[0]?.description || ''}
                      width={40}
                      height={40}
                    />
                    <div>{Math.round(h.main?.temp)}°</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 