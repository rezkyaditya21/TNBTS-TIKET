'use client';

import React, { useState } from 'react';
import { Calendar, MapPin, Users, ShieldCheck, ArrowRight, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function HeroSection({ destinations = [], onStartBooking, systemStatus, systemNotice }) {
  const [selectedDestId, setSelectedDestId] = useState(destinations[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Cinematic Background with Vignette & Gradients */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=2000&q=90')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-slate-950/50 to-slate-950" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        
        {/* Official Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-md mb-6 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Sistem Tata Kelola Kunjungan & Tiket Terpadu 2026</span>
        </div>

        {/* Grand Typography */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
          Keagungan <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-400">Bromo Tengger</span> Semeru
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed mb-8">
          Nikmati kemudahan pemesanan tiket resmi kawasan konservasi dengan sistem <span className="text-white font-semibold">anti-monopoli kuota</span>, verifikasi NIK terikat, dan tiket digital berenkripsi dinamis.
        </p>

        {/* Live Status Notice Alert */}
        {systemNotice && (
          <div className="max-w-2xl mx-auto mb-10 p-3.5 rounded-2xl glass-panel border border-emerald-500/30 text-left flex items-start gap-3 shadow-xl">
            <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Informasi Kondisi Kawasan</div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{systemNotice}</p>
            </div>
          </div>
        )}

        {/* Interactive Booking Quick Bar */}
        <div className="max-w-4xl mx-auto glass-panel p-3 sm:p-4 rounded-2xl shadow-2xl border border-white/10 glow-amber">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Spot Selector */}
            <div className="text-left bg-slate-900/80 p-3 rounded-xl border border-slate-800 focus-within:border-amber-500/60 transition">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                Pilih Site Destinasi
              </label>
              <select
                value={selectedDestId}
                onChange={(e) => setSelectedDestId(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer"
              >
                {destinations.map(d => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selector */}
            <div className="text-left bg-slate-900/80 p-3 rounded-xl border border-slate-800 focus-within:border-amber-500/60 transition">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Tanggal Kunjungan
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer"
              />
            </div>

            {/* Action CTA */}
            <div className="flex items-center">
              <button
                onClick={() => onStartBooking(selectedDestId || destinations[0]?.id, selectedDate)}
                className="w-full h-full min-h-[50px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Cek Kuota & Booking</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Guarantee Badges */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-around gap-2 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              1 NIK = 1 Tiket Terverifikasi
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Kunci Kuota 15 Menit Anti-Hoarding
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              QR Code Dinamis Anti-Screenshot
            </span>
          </div>

        </div>

      </div>
    </section>
  );
}
