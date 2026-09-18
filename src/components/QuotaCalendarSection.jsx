'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Users, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export default function QuotaCalendarSection({ destinations = [], onSelectDateAndDestination }) {
  const [selectedDestId, setSelectedDestId] = useState(destinations[0]?.id || '');
  const [quotas, setQuotas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (destinations.length > 0 && !selectedDestId) {
      setSelectedDestId(destinations[0].id);
    }
  }, [destinations, selectedDestId]);

  useEffect(() => {
    if (!selectedDestId) return;

    async function fetch14DayQuotas() {
      setLoading(true);
      try {
        const res = await fetch(`/api/quotas?destinationId=${selectedDestId}`);
        const data = await res.json();
        if (data.success) {
          // Group or pick sunrise slots
          setQuotas(data.quotas || []);
        }
      } catch (err) {
        console.error('Failed to load quota calendar:', err);
      } finally {
        setLoading(false);
      }
    }

    fetch14DayQuotas();
  }, [selectedDestId]);

  const selectedDest = destinations.find(d => d.id === selectedDestId) || destinations[0];

  // Group quotas by date
  const uniqueDateQuotas = [];
  const seenDates = new Set();
  for (const q of quotas) {
    if (!seenDates.has(q.visit_date)) {
      seenDates.add(q.visit_date);
      uniqueDateQuotas.push(q);
    }
  }

  const formatDayName = (dateStr) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(dateStr);
    return days[d.getDay()];
  };

  const formatDateDisplay = (dateStr) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(dateStr);
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Calendar className="w-3.5 h-3.5" />
          Transparansi Publik Real-Time
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Kalender Ketersediaan Kuota 14 Hari
        </h2>
        <p className="text-slate-400 text-sm sm:text-base mt-3">
          Pantau sisa kuota harian secara langsung tanpa perantara calo. Klik tanggal untuk langsung memesan tiket Anda.
        </p>
      </div>

      {/* Destination Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 justify-start sm:justify-center no-scrollbar">
        {destinations.map(d => (
          <button
            key={d.id}
            onClick={() => setSelectedDestId(d.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
              selectedDestId === d.id
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* 14 Days Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
          Memperbarui ketersediaan kuota resmi dari database...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {uniqueDateQuotas.slice(0, 14).map((q, idx) => {
            const isFull = q.available_quota <= 0;
            const isTight = q.available_quota > 0 && q.available_quota < 100;
            const dayName = formatDayName(q.visit_date);
            const isWeekend = dayName === 'Sabtu' || dayName === 'Minggu';

            return (
              <button
                key={idx}
                disabled={isFull}
                onClick={() => onSelectDateAndDestination(selectedDestId, q.visit_date)}
                className={`p-3.5 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between group hover:-translate-y-1 ${
                  isFull
                    ? 'bg-slate-900/40 border-slate-800/80 opacity-60 cursor-not-allowed'
                    : isTight
                    ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/15 cursor-pointer shadow-lg shadow-amber-500/5'
                    : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900 cursor-pointer shadow-lg shadow-slate-950/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                    <span className={isWeekend ? 'text-amber-400 font-bold' : ''}>{dayName}</span>
                    {idx === 0 && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">Hari Ini</span>
                    )}
                  </div>
                  <div className="text-base font-extrabold text-white font-mono">
                    {formatDateDisplay(q.visit_date)}
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-800/80">
                  <div className={`text-xs font-black font-mono ${
                    isFull ? 'text-rose-400' : isTight ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {isFull ? 'PENUH' : `${q.available_quota} Kuota`}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                    <span>{isFull ? 'Habis' : isTight ? 'Menipis' : 'Tersedia'}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Legend strip */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
          <span>Tersedia (&gt;100 kuota)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
          <span>Menipis (&lt;100 kuota)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Habis (0 kuota)</span>
        </div>
      </div>

    </section>
  );
}
