'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Compass, ArrowLeft, AlertTriangle, CheckCircle2, Clock, RefreshCw, MapPin } from 'lucide-react';

const STATUS_CONFIG = {
  OPEN:    { label: 'Buka Normal',     color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dot: 'bg-emerald-400', icon: CheckCircle2 },
  LIMITED: { label: 'Akses Terbatas',  color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',   dot: 'bg-amber-400',   icon: AlertTriangle },
  CLOSED:  { label: 'Ditutup',         color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',      dot: 'bg-rose-400',    icon: AlertTriangle },
};

export default function StatusPage() {
  const [data, setData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const json = await res.json();
      if (json.success) {
        setData(json);
        setLastUpdate(new Date());
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const kawasanCfg = STATUS_CONFIG[data?.kawasan?.status] || STATUS_CONFIG.OPEN;
  const KawasanIcon = kawasanCfg.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" /><span>Kembali ke Beranda</span>
          </Link>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Status Kawasan TNBTS</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">

        {/* Global Status Banner */}
        {loading ? (
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center text-xs text-slate-400 animate-pulse">Memuat status kawasan...</div>
        ) : data ? (
          <div className={`glass-panel p-6 rounded-3xl border ${kawasanCfg.color} space-y-3`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${kawasanCfg.dot} animate-pulse`} />
              <h2 className="text-lg font-black uppercase tracking-wide">Status Kawasan: {kawasanCfg.label}</h2>
            </div>
            {data.kawasan.notice && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-950/50 border border-current/20 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{data.kawasan.notice}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs opacity-70">
              <Clock className="w-3.5 h-3.5" />
              <span>Diperbarui otomatis setiap 60 detik. Terakhir: {lastUpdate?.toLocaleTimeString('id-ID') || '—'}</span>
              <button onClick={fetchStatus} className="ml-auto p-1 hover:opacity-100 opacity-60 transition">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : null}

        {/* Destinations Grid */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Status Per Destinasi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(data?.destinations || []).map((dest) => {
              const cfg = STATUS_CONFIG[dest.status] || STATUS_CONFIG.OPEN;
              const Icon = cfg.icon;
              return (
                <div key={dest.id} className={`glass-card p-5 rounded-2xl border ${cfg.color} space-y-3`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{dest.name}</h4>
                      <div className="flex items-center gap-1 text-xs opacity-70 mt-0.5">
                        <MapPin className="w-3 h-3" /><span>{dest.location_zone}</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold shrink-0 ${cfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      <span>{cfg.label}</span>
                    </div>
                  </div>
                  {dest.status_notice && (
                    <p className="text-xs opacity-80 border-t border-current/20 pt-2">{dest.status_notice}</p>
                  )}
                  <div className="text-xs opacity-60">
                    Kapasitas harian: <span className="font-bold">{dest.daily_capacity?.toLocaleString('id-ID')} pengunjung</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        {data?.kawasan?.status !== 'CLOSED' && (
          <div className="text-center pt-4">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:from-amber-400 transition-all hover:scale-105"
            >
              <Compass className="w-4 h-4" />
              <span>Pesan Tiket Kunjungan</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
