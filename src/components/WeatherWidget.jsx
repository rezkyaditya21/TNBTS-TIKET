'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Cloud, Wind, Thermometer, AlertCircle, Compass, Clock, Activity } from 'lucide-react';

export default function WeatherWidget() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800/90 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 items-center">
          
          {/* Time & Station */}
          <div className="col-span-2 sm:col-span-1 border-b sm:border-b-0 sm:border-r border-slate-800/80 pb-3 sm:pb-0 sm:pr-4">
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>Stasiun Klimatologi</span>
            </div>
            <div className="text-base font-extrabold text-white font-mono mt-0.5">
              {time || '05:14:00 WIB'}
            </div>
            <div className="text-[11px] text-slate-400">Pos Pengamatan Cemorolawang</div>
          </div>

          {/* Temperature & Altitude */}
          <div className="border-r border-slate-800/80 pr-4">
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Suhu Udara</span>
            </div>
            <div className="text-lg font-black text-white font-mono mt-0.5">
              11°C <span className="text-xs text-slate-400 font-normal">/ 51°F</span>
            </div>
            <div className="text-[10px] text-slate-400">Elevasi 2.329 mdpl</div>
          </div>

          {/* Golden Sunrise */}
          <div className="border-r border-slate-800/80 pr-4">
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Golden Sunrise</span>
            </div>
            <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
              05:14 WIB
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">Kondisi Langit Bersih</div>
          </div>

          {/* Wind & Fog */}
          <div className="border-r border-slate-800/80 pr-4">
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Wind className="w-3.5 h-3.5 text-slate-300" />
              <span>Angin &amp; Kabut</span>
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              14 km/jam
            </div>
            <div className="text-[10px] text-slate-400">Kabut Tipis Kaldera</div>
          </div>

          {/* Volcanic Status PVMBG */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold uppercase">
              <Activity className="w-3.5 h-3.5" />
              <span>Status Vulkanik</span>
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
