'use client';

import React from 'react';
import { MapPin, Users, Clock, ShieldCheck, ArrowRight, Sun, Sparkles } from 'lucide-react';

export default function DestinationsCatalog({ destinations = [], onSelectDestination }) {
  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <section id="destinasi" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Katalog Resmi Kawasan Konservasi
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Destinasi Wisata & Spot Matahari Terbit
        </h2>
        <p className="text-slate-400 text-sm sm:text-base mt-3">
          Seluruh situs kunjungan dikelola dengan batasan daya dukung lingkungan (*carrying capacity*) demi menjaga kelestarian ekosistem alam TNBTS.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {destinations.map((dest) => {
          const isLimited = dest.status === 'LIMITED';
          const isClosed = dest.status === 'CLOSED';

          return (
            <div
              key={dest.id}
              className="glass-card rounded-2xl overflow-hidden border border-slate-800 hover:border-amber-500/40 transition-all duration-300 group flex flex-col hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10"
            >
              {/* Image & Badges */}
              <div className="relative h-52 overflow-hidden">
                <img
                  src={dest.cover_image_url}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${
                    isClosed
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : isLimited
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {isClosed ? 'Ditutup' : isLimited ? 'Akses Terbatas' : 'Kuota Buka'}
                  </span>
                </div>

                {/* Capacity Badge */}
                <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-amber-400" />
                  <span>Max {dest.daily_capacity} orang/hari</span>
                </div>

                {/* Destination Name on Image */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{dest.location_zone}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white leading-snug drop-shadow-md">
                    {dest.name}
                  </h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">
                    {dest.description}
                  </p>

                  {/* Pricing info */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 mb-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Wisatawan Domestik:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {formatIDR(dest.ticket_price_domestic_weekday)} <span className="text-[10px] text-slate-500 font-normal">/ weekday</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Wisatawan Mancanegara:</span>
                      <span className="font-bold text-amber-400 font-mono">
                        {formatIDR(dest.ticket_price_foreign_weekday)} <span className="text-[10px] text-slate-500 font-normal">/ weekday</span>
                      </span>
                    </div>
                  </div>

                  {/* Slots info */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {dest.slots?.map(s => (
                      <span key={s.id} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 flex items-center gap-1 border border-slate-700/60">
                        <Clock className="w-2.5 h-2.5 text-amber-400" />
                        {s.slot_name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Booking Button */}
                <button
                  disabled={isClosed}
                  onClick={() => onSelectDestination(dest.id)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    isClosed
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-md shadow-amber-500/10 group-hover:shadow-amber-500/25'
                  }`}
                >
                  <span>{isClosed ? 'Kawasan Tutup' : 'Pilih Destinasi & Pesan'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
