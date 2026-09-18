'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Ticket, DollarSign, ShieldAlert, ArrowLeft,
  CheckCircle2, Clock, AlertTriangle, RefreshCw, Eye, ShieldCheck, Filter
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | quotas | security | bookings

  const [statusKawasan, setStatusKawasan] = useState('OPEN');
  const [statusNotice, setStatusNotice] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, secRes, setRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/security'),
        fetch('/api/admin/settings'),
      ]);

      const dashData = await dashRes.json();
      const secData = await secRes.json();
      const setData = await setRes.json();

      if (dashData.success) setData(dashData);
      if (secData.success) setSecurityEvents(secData.events || []);
      if (setData.success) {
        const sk = setData.settings?.find(s => s.key === 'status_kawasan')?.value || 'OPEN';
        const sn = setData.settings?.find(s => s.key === 'status_kawasan_notice')?.value || '';
        setStatusKawasan(sk);
        setStatusNotice(sn);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatus = async (newStatus, customNotice) => {
    setIsSavingStatus(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statusKawasan: newStatus,
          statusNotice: customNotice !== undefined ? customNotice : statusNotice,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        setStatusKawasan(newStatus);
        if (customNotice !== undefined) setStatusNotice(customNotice);
        fetchDashboard();
        alert('Status kawasan & pengumuman resmi berhasil diperbarui seketika!');
      }
    } catch (err) {
      alert('Gagal memperbarui status kawasan.');
    } finally {
      setIsSavingStatus(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleUpdateSecurityStatus = async (eventId, newStatus) => {
    try {
      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, status: newStatus }),
      });
      const resData = await res.json();
      if (resData.success) {
        fetchDashboard();
      }
    } catch (err) {
      alert('Gagal memperbarui status keamanan.');
    }
  };

  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Admin Top Navbar */}
      <header className="glass-panel border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Portal Publik</span>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-amber-400" />
            <span>Dashboard Pusat Balai TNBTS</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
            Sistem Normal
          </span>
        </div>
      </header>

      {/* Main Admin Container */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-8 flex-1">
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'overview' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            Ringkasan Operasional
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'security' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Aktivitas Mencurigakan &amp; Anti-Bot ({securityEvents.filter(e => e.status === 'OPEN').length})</span>
          </button>
        </div>

        {loading && !data ? (
          <div className="py-24 text-center text-slate-400 animate-pulse text-sm">
            Memuat data telemetri operasional...
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in">
                
                {/* Emergency Park Status Control Bar */}
                <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Kendali Balai Besar TNBTS</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Real-time Broadcast</span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">Status Operasional &amp; Buka/Tutup Kawasan</h3>
                    </div>

                    {/* 3 State Toggle Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveStatus('OPEN', 'Kawasan Bromo beroperasi normal. Cuaca cerah dan akses jalan lancar.')}
                        disabled={isSavingStatus}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                          statusKawasan === 'OPEN'
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/25'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>Buka Normal</span>
                      </button>

                      <button
                        onClick={() => handleSaveStatus('LIMITED', 'Aktivitas vulkanik Semeru Level II Waspada. Jalur puncak ditutup sementara.')}
                        disabled={isSavingStatus}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                          statusKawasan === 'LIMITED'
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>Akses Terbatas</span>
                      </button>

                      <button
                        onClick={() => handleSaveStatus('CLOSED', 'Kawasan ditutup total karena cuaca ekstrem / peningkatan status vulkanik.')}
                        disabled={isSavingStatus}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                          statusKawasan === 'CLOSED'
                            ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/25'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                        <span>Tutup Kawasan</span>
                      </button>
                    </div>
                  </div>

                  {/* Notice text broadcast input */}
                  <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                    <input
                      type="text"
                      placeholder="Tuliskan pengumuman resmi cuaca/vulkanik untuk pengunjung di halaman depan..."
                      value={statusNotice}
                      onChange={(e) => setStatusNotice(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={() => handleSaveStatus(statusKawasan, statusNotice)}
                      disabled={isSavingStatus}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 transition"
                    >
                      {isSavingStatus ? 'Menyimpan...' : 'Perbarui Pengumuman'}
                    </button>
                  </div>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="glass-card p-5 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Pengunjung Terbayar (Hari Ini)</span>
                      <Users className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-black text-white font-mono mt-2">
                      {data?.stats?.paidVisitors || 0} <span className="text-xs font-normal text-slate-400">orang</span>
                    </div>
                    <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
                      {data?.stats?.paidBookings || 0} transaksi lunas
                    </div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Pendapatan Resmi PNBP</span>
                      <DollarSign className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-amber-400 font-mono mt-2">
                      {formatIDR(data?.stats?.totalRevenue || 0)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Setoran langsung kas negara
                    </div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Check-in Pos Masuk (Hari Ini)</span>
                      <Ticket className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-3xl font-black text-cyan-300 font-mono mt-2">
                      {data?.stats?.scannedToday || 0} <span className="text-xs font-normal text-slate-400">tiket</span>
                    </div>
                    <div className="text-[11px] text-cyan-400 mt-1 font-semibold">
                      Terverifikasi di gerbang
                    </div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Anomali / Potensi Calo</span>
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-3xl font-black text-rose-400 font-mono mt-2">
                      {data?.stats?.suspiciousEvents || 0}
                    </div>
                    <div className="text-[11px] text-rose-400 mt-1 font-semibold">
                      Perlu ditinjau pengelola
                    </div>
                  </div>
                </div>

                {/* Quota Monitoring Section */}
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Monitoring Kuota Kunjungan Hari Ini</h3>
                      <p className="text-xs text-slate-400">Alokasi kuota otomatis terproteksi concurrency locking.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data?.quotaSummary?.map((q, idx) => {
                      const usedPercent = Math.min(100, Math.round(((q.reserved_quota + q.paid_quota) / q.total_quota) * 100));
                      return (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-xs text-white">{q.destination_name}</span>
                            <span className="text-[11px] font-mono text-emerald-400 font-bold">
                              {q.available_quota} sisa
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                usedPercent > 85 ? 'bg-rose-500' : usedPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${usedPercent}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Terkunci: {q.reserved_quota}</span>
                            <span>Lunas: {q.paid_quota}</span>
                            <span>Total: {q.total_quota}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Bookings Table */}
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="text-base font-bold text-white">Transaksi Booking Terkini</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                          <th className="pb-3 font-bold">Kode Booking</th>
                          <th className="pb-3 font-bold">Pemesan</th>
                          <th className="pb-3 font-bold">Destinasi</th>
                          <th className="pb-3 font-bold">Tanggal</th>
                          <th className="pb-3 font-bold">Jumlah</th>
                          <th className="pb-3 font-bold">Total Biaya</th>
                          <th className="pb-3 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {data?.recentBookings?.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-3 font-mono font-bold text-amber-300">{b.booking_code}</td>
                            <td className="py-3">
                              <div className="font-bold text-white">{b.user_name}</div>
                              <div className="text-[10px] text-slate-400">{b.user_email}</div>
                            </td>
                            <td className="py-3 text-slate-300">{b.destination_name}</td>
                            <td className="py-3 text-slate-300">{b.visit_date}</td>
                            <td className="py-3 font-mono">{b.total_visitors} Org</td>
                            <td className="py-3 font-mono font-bold text-white">{formatIDR(b.total_amount)}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                b.status === 'PAID'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : b.status === 'RESERVED'
                                  ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY & ANTI-BOT TAB */}
            {activeTab === 'security' && (
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-lg font-bold text-white">Pusat Pengawasan Aktivitas Mencurigakan &amp; Bot</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Mendeteksi skrip otomatis, auto-filler, multi-session hoarding, dan anomali perilaku pemesanan.
                  </p>
                </div>

                {securityEvents.length === 0 ? (
                  <div className="py-12 text-center text-xs text-emerald-400 flex flex-col items-center gap-2">
                    <ShieldCheck className="w-8 h-8" />
                    <span>Tidak ada anomali aktivitas mencurigakan yang terdeteksi saat ini. Sistem aman.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {securityEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {evt.action_type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Skor Risiko: {evt.score || 0}/100 ({evt.risk_level})
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              evt.status === 'OPEN' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {evt.status}
                            </span>
                          </div>
                          <p className="text-xs text-white font-medium">{evt.reason}</p>
                          <div className="text-[11px] text-slate-400">
                            Pengguna: {evt.user_name || 'Tamu Anonim'} • IP Hash: <span className="font-mono">{evt.ip_hash}</span> • Tindakan Sistem: <span className="text-amber-400 font-bold">{evt.action_taken}</span>
                          </div>
                        </div>

                        {evt.status === 'OPEN' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleUpdateSecurityStatus(evt.id, 'REVIEWED')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                            >
                              Tandai Ditinjau
                            </button>
                            <button
                              onClick={() => handleUpdateSecurityStatus(evt.id, 'FALSE_POSITIVE')}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                            >
                              Bukan Calo
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
