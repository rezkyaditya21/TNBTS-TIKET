'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Cloud, Wind, Thermometer, Activity, Compass, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';

const WMO_DESCRIPTIONS = {
  0: 'Langit Bersih', 1: 'Cerah Berawan', 2: 'Sebagian Berawan', 3: 'Mendung',
  45: 'Berkabut', 48: 'Kabut Beku', 51: 'Gerimis Ringan', 53: 'Gerimis', 55: 'Gerimis Lebat',
  61: 'Hujan Ringan', 63: 'Hujan Sedang', 65: 'Hujan Lebat',
  71: 'Salju Ringan', 73: 'Salju Sedang', 75: 'Salju Lebat',
  80: 'Hujan Lokal', 81: 'Hujan Deras', 95: 'Badai Petir',
};

function WeatherIcon({ code, className }) {
  if (code >= 95) return <CloudLightning className={className} />;
  if (code >= 61) return <CloudRain className={className} />;
  if (code >= 71) return <CloudSnow className={className} />;
  if (code >= 45) return <Cloud className={className} />;
  if (code >= 2) return <Cloud className={className} />;
  return <Sun className={className} />;
}

const CACHE_KEY = 'tnbts_weather_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export default function WeatherWidget() {
  const [time, setTime] = useState('');
  const [weather, setWeather] = useState(null);
  const [weatherUnavailable, setWeatherUnavailable] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchWeather() {
      // Check cache
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setWeather(cached.data);
          return;
        }
      } catch {}

      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=-7.942&longitude=112.953&current=temperature_2m,wind_speed_10m,weather_code&timezone=Asia%2FJakarta',
          { next: { revalidate: 0 } }
        );
        if (!res.ok) throw new Error('API error');
        const json = await res.json();
        const data = {
          temperature: Math.round(json.current.temperature_2m),
          windSpeed: Math.round(json.current.wind_speed_10m),
          weatherCode: json.current.weather_code,
          description: WMO_DESCRIPTIONS[json.current.weather_code] || 'Kondisi Tidak Diketahui',
        };
        setWeather(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      } catch {
        setWeatherUnavailable(true);
      }
    }
    fetchWeather();
  }, []);

  const temp = weather ? `${weather.temperature}°C` : weatherUnavailable ? '—°C' : '...';
  const wind = weather ? `${weather.windSpeed} km/jam` : weatherUnavailable ? '— km/jam' : '...';
  const desc = weather ? weather.description : weatherUnavailable ? 'Data Tidak Tersedia' : 'Memuat...';
  const wCode = weather?.weatherCode ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800/90 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 items-center">

          {/* Station & Time */}
          <div className="col-span-2 sm:col-span-1 border-b sm:border-b-0 sm:border-r border-slate-800/80 pb-3 sm:pb-0 sm:pr-4">
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" /><span>Stasiun Klimatologi</span>
            </div>
            <div className="text-base font-extrabold text-white font-mono mt-0.5">{time || '--:--:-- WIB'}</div>
            <div className="text-[11px] text-slate-400">Pos Pengamatan Cemorolawang</div>
          </div>

          {/* Temperature */}
          <div className="border-r border-slate-800/80 pr-4">
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Thermometer className="w-3.5 h-3.5 text-cyan-400" /><span>Suhu Udara</span>
            </div>
            <div className={`text-lg font-black text-white font-mono mt-0.5 ${weather === null && !weatherUnavailable ? 'animate-pulse' : ''}`}>
              {temp}
            </div>
            <div className="text-[10px] text-slate-400">Elevasi 2.329 mdpl</div>
          </div>

          {/* Weather Condition */}
          <div className="border-r border-slate-800/80 pr-4">
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <WeatherIcon code={wCode} className="w-3.5 h-3.5 text-amber-400" />
              <span>Kondisi Cuaca</span>
            </div>
            <div className={`text-sm font-black text-amber-400 font-mono mt-0.5 ${weather === null && !weatherUnavailable ? 'animate-pulse' : ''}`}>
              {desc}
            </div>
            {weatherUnavailable && <div className="text-[10px] text-slate-500">(Data Tidak Tersedia)</div>}
          </div>

          {/* Wind */}
          <div className="border-r border-slate-800/80 pr-4">
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Wind className="w-3.5 h-3.5 text-slate-300" /><span>Angin</span>
            </div>
            <div className={`text-sm font-bold text-white mt-0.5 ${weather === null && !weatherUnavailable ? 'animate-pulse' : ''}`}>
              {wind}
            </div>
            <div className="text-[10px] text-slate-400">Kawasan Kaldera</div>
          </div>

          {/* Volcanic Status */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold uppercase">
              <Activity className="w-3.5 h-3.5" /><span>Status Vulkanik</span>
            </div>
            <div className="text-xs font-bold text-emerald-300 mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Level II (Waspada)</span>
            </div>
            <div className="text-[10px] text-slate-400">Radius Aman 1 Km Kawah</div>
          </div>
        </div>
      </div>
    </div>
  );
}
