'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Ticket, DollarSign, ShieldAlert, ArrowLeft,
  CheckCircle2, Clock, AlertTriangle, RefreshCw, ShieldCheck,
  MapPin, CalendarDays, FileDown, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight,
  Edit2, Plus, X, Search,
} from 'lucide-react';

const TABS = [
  { id: 'overview',     label: 'Ringkasan',       icon: LayoutDashboard },
  { id: 'quotas',       label: 'Kuota',            icon: CalendarDays },
  { id: 'destinations', label: 'Destinasi',        icon: MapPin },
  { id: 'refunds',      label: 'Refund',           icon: DollarSign },
  { id: 'reports',      label: 'Laporan',          icon: FileDown },
  { id: 'users',        label: 'Pengguna',         icon: Users },
  { id: 'security',     label: 'Keamanan',         icon: ShieldAlert },
];

const formatIDR = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Overview
  const [dashboardData, setDashboardData] = useState(null);
  const [statusKawasan, setStatusKawasan] = useState('OPEN');
  const [statusNotice, setStatusNotice] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  // Security
  const [securityEvents, setSecurityEvents] = useState([]);

  // Quotas
  const [quotas, setQuotas] = useState([]);
  const [quotaDestinations, setQuotaDestinations] = useState([]);
  const [quotaForm, setQuotaForm] = useState({ destinationId: '', slotId: '', startDate: '', endDate: '', totalQuota: 100 });
  const [quotaFilter, setQuotaFilter] = useState({ destinationId: '', startDate: '', endDate: '' });
  const [showQuotaForm, setShowQuotaForm] = useState(false);
  const [quotaLoading, setQuotaLoading] = useState(false);

  // Destinations
  const [destinations, setDestinations] = useState([]);
  const [editDest, setEditDest] = useState(null);
  const [destSaving, setDestSaving] = useState(false);

  // Refunds
  const [refunds, setRefunds] = useState([]);
  const [refundFilter, setRefundFilter] = useState('REQUESTED');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Reports
  const [reportData, setReportData] = useState(null);
  const [reportDates, setReportDates] = useState({ startDate: '', endDate: '' });
  const [reportLoading, setReportLoading] = useState(false);

  // Users
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(1);

  // ─── Fetchers ────────────────────────────────────────────
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, secRes, setRes] = await Promise.all([
        fetch('/api/admin/dashboard'), fetch('/api/admin/security'), fetch('/api/admin/settings'),
      ]);
      const dash = await dashRes.json();
      const sec = await secRes.json();
      const sets = await setRes.json();
      if (dash.success) setDashboardData(dash);
      if (sec.success) setSecurityEvents(sec.events || []);
      if (sets.success) {
        setStatusKawasan(sets.settings?.find(s => s.key === 'status_kawasan')?.value || 'OPEN');
        setStatusNotice(sets.settings?.find(s => s.key === 'status_kawasan_notice')?.value || '');
      }
    } finally { setLoading(false); }
  }, []);

  const fetchQuotas = useCallback(async () => {
    setQuotaLoading(true);
    try {
      const params = new URLSearchParams();
      if (quotaFilter.destinationId) params.set('destinationId', quotaFilter.destinationId);
      if (quotaFilter.startDate) params.set('startDate', quotaFilter.startDate);
      if (quotaFilter.endDate) params.set('endDate', quotaFilter.endDate);
      const [qRes, dRes] = await Promise.all([
        fetch(`/api/admin/quotas?${params}`),
        fetch('/api/admin/destinations'),
      ]);
      const qData = await qRes.json();
      const dData = await dRes.json();
      if (qData.success) setQuotas(qData.quotas || []);
      if (dData.success) setQuotaDestinations(dData.destinations || []);
    } finally { setQuotaLoading(false); }
  }, [quotaFilter]);

  const fetchDestinations = useCallback(async () => {
    const res = await fetch('/api/admin/destinations');
    const data = await res.json();
    if (data.success) setDestinations(data.destinations || []);
  }, []);

  const fetchRefunds = useCallback(async () => {
    const res = await fetch(`/api/admin/refunds?status=${refundFilter}`);
    const data = await res.json();
    if (data.success) setRefunds(data.refunds || []);
  }, [refundFilter]);

  const fetchReports = useCallback(async () => {
    setReportLoading(true);
    try {
      const params = new URLSearchParams();
      if (reportDates.startDate) params.set('startDate', reportDates.startDate);
      if (reportDates.endDate) params.set('endDate', reportDates.endDate);
      const res = await fetch(`/api/admin/reports?${params}`);
      const data = await res.json();
      if (data.success) setReportData(data);
    } finally { setReportLoading(false); }
  }, [reportDates]);

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams({ page: userPage, search: userSearch });
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    if (data.success) { setUsers(data.users || []); setUserTotal(data.total || 0); setUserTotalPages(data.totalPages || 1); }
  }, [userPage, userSearch]);

  // Load tab data on switch
  useEffect(() => {
    if (activeTab === 'overview') fetchOverview();
    if (activeTab === 'quotas') fetchQuotas();
    if (activeTab === 'destinations') fetchDestinations();
    if (activeTab === 'refunds') fetchRefunds();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'security') fetchOverview();
  }, [activeTab]);

  useEffect(() => { if (activeTab === 'refunds') fetchRefunds(); }, [refundFilter]);
  useEffect(() => { if (activeTab === 'users') fetchUsers(); }, [userPage, userSearch]);

  // ─── Handlers ────────────────────────────────────────────
  const handleSaveStatus = async (newStatus, notice) => {
    setIsSavingStatus(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusKawasan: newStatus, statusNotice: notice ?? statusNotice }),
      });
      const data = await res.json();
      if (data.success) { setStatusKawasan(newStatus); if (notice !== undefined) setStatusNotice(notice); }
      else alert(data.message);
    } finally { setIsSavingStatus(false); }
  };

  const handleCreateQuota = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/quotas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(quotaForm),
    });
    const data = await res.json();
    alert(data.message);
    if (data.success) { setShowQuotaForm(false); fetchQuotas(); }
  };

  const handleToggleQuota = async (id, currentActive) => {
    const res = await fetch(`/api/admin/quotas/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentActive }),
    });
    const data = await res.json();
    if (data.success) fetchQuotas(); else alert(data.message);
  };

  const handleSaveDest = async (e) => {
    e.preventDefault();
    setDestSaving(true);
    try {
      const res = await fetch(`/api/admin/destinations/${editDest.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editDest),
      });
      const data = await res.json();
      if (data.success) { setEditDest(null); fetchDestinations(); } else alert(data.message);
    } finally { setDestSaving(false); }
  };

  const handleReviewRefund = async (action) => {
    if (action === 'REJECT' && !reviewNotes.trim()) { alert('Alasan penolakan wajib diisi.'); return; }
    const res = await fetch(`/api/admin/refunds/${reviewModal.id}/review`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reviewNotes }),
    });
    const data = await res.json();
    alert(data.message);
    if (data.success) { setReviewModal(null); setReviewNotes(''); fetchRefunds(); }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams({ format: 'csv' });
    if (reportDates.startDate) params.set('startDate', reportDates.startDate);
    if (reportDates.endDate) params.set('endDate', reportDates.endDate);
    window.open(`/api/admin/reports?${params}`, '_blank');
  };

  const handleToggleUser = async (id) => {
    const res = await fetch(`/api/admin/users/${id}/toggle-status`, { method: 'POST' });
    const data = await res.json();
    if (data.success) fetchUsers(); else alert(data.message);
  };

  const handleUpdateSecurityStatus = async (eventId, status) => {
    const res = await fetch('/api/admin/security', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, status }),
    });
    if ((await res.json()).success) fetchOverview();
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Sticky Header */}
      <header className="glass-panel border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Portal Publik</span>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-amber-400" />
            <span>Dashboard Admin TNBTS</span>
          </h1>
        </div>
        <button onClick={fetchOverview} className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Tab Nav */}
        <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-800">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === id ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800'
              }`}>
              <Icon className="w-3.5 h-3.5" />{label}
              {id === 'security' && securityEvents.filter(e => e.status === 'OPEN').length > 0 && (
                <span className="ml-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {securityEvents.filter(e => e.status === 'OPEN').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Status Control */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Kontrol Status Kawasan Real-time</h3>
              <div className="flex flex-wrap gap-2">
                {[['OPEN','Buka Normal','emerald'],['LIMITED','Akses Terbatas','amber'],['CLOSED','Tutup Kawasan','rose']].map(([val, label, color]) => (
                  <button key={val} onClick={() => handleSaveStatus(val)} disabled={isSavingStatus}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      statusKawasan === val
                        ? `bg-${color}-500 ${val==='CLOSED'?'text-white':'text-slate-950'} border-${color}-400 shadow-lg`
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}>
                    <span className={`w-2 h-2 rounded-full bg-${color}-400`}></span>{label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Pengumuman darurat untuk pengunjung..."
                  value={statusNotice} onChange={e => setStatusNotice(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button onClick={() => handleSaveStatus(statusKawasan, statusNotice)} disabled={isSavingStatus}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 transition">
                  {isSavingStatus ? 'Menyimpan...' : 'Perbarui'}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Pengunjung Lunas (Hari Ini)', val: dashboardData?.stats?.paidVisitors || 0, unit: 'orang', color: 'text-emerald-400', icon: Users },
                { label: 'Pendapatan PNBP', val: formatIDR(dashboardData?.stats?.totalRevenue), unit: '', color: 'text-amber-400', icon: DollarSign },
                { label: 'Check-in (Hari Ini)', val: dashboardData?.stats?.scannedToday || 0, unit: 'tiket', color: 'text-cyan-300', icon: Ticket },
                { label: 'Anomali / Calo', val: dashboardData?.stats?.suspiciousEvents || 0, unit: '', color: 'text-rose-400', icon: ShieldAlert },
              ].map(({ label, val, unit, color, icon: Icon }) => (
                <div key={label} className="glass-card p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                    <span>{label}</span><Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div className={`text-2xl font-black font-mono ${color}`}>{val} <span className="text-xs text-slate-400 font-normal">{unit}</span></div>
                </div>
              ))}
            </div>

            {/* Quota Overview */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-4">Kuota Hari Ini</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(dashboardData?.quotaSummary || []).map((q, i) => {
                  const used = q.reserved_quota + q.paid_quota;
                  const pct = q.total_quota > 0 ? Math.min(100, Math.round((used / q.total_quota) * 100)) : 0;
                  return (
                    <div key={i} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-white">{q.destination_name}</span>
                        <span className="text-emerald-400">{q.available_quota} sisa</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full">
                        <div className={`h-full rounded-full ${pct > 85 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Reserved: {q.reserved_quota}</span><span>Paid: {q.paid_quota}</span><span>Total: {q.total_quota}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent bookings */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-4">Transaksi Terkini</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                    {['Kode','Pemesan','Destinasi','Tanggal','Total','Status'].map(h => <th key={h} className="pb-2 font-bold text-left">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(dashboardData?.recentBookings || []).map(b => (
                      <tr key={b.id} className="hover:bg-slate-900/40">
                        <td className="py-2 font-mono font-bold text-amber-300">{b.booking_code}</td>
                        <td className="py-2"><div className="font-bold text-white">{b.user_name}</div><div className="text-slate-500 text-[10px]">{b.user_email}</div></td>
                        <td className="py-2 text-slate-300">{b.destination_name}</td>
                        <td className="py-2 text-slate-300">{b.visit_date}</td>
                        <td className="py-2 font-mono font-bold">{formatIDR(b.total_amount)}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' :
                            b.status === 'RESERVED' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>{b.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── QUOTAS ── */}
        {activeTab === 'quotas' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Manajemen Kuota Kunjungan</h2>
              <button onClick={() => setShowQuotaForm(!showQuotaForm)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition">
                <Plus className="w-3.5 h-3.5" /><span>Buka Kuota Baru</span>
              </button>
            </div>

            {showQuotaForm && (
              <form onSubmit={handleCreateQuota} className="glass-panel p-5 rounded-2xl border border-amber-500/30 space-y-4">
                <h3 className="text-sm font-bold text-white">Form Buka Kuota Baru</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Destinasi</label>
                    <select value={quotaForm.destinationId} onChange={e => setQuotaForm(f => ({ ...f, destinationId: e.target.value }))}
                      required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400">
                      <option value="">Pilih destinasi...</option>
                      {quotaDestinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggal Mulai</label>
                    <input type="date" required value={quotaForm.startDate} onChange={e => setQuotaForm(f => ({ ...f, startDate: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggal Akhir</label>
                    <input type="date" value={quotaForm.endDate} onChange={e => setQuotaForm(f => ({ ...f, endDate: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Kuota/Hari</label>
                    <input type="number" min="1" max="9999" required value={quotaForm.totalQuota}
                      onChange={e => setQuotaForm(f => ({ ...f, totalQuota: parseInt(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition">Buat Kuota</button>
                  <button type="button" onClick={() => setShowQuotaForm(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition">Batal</button>
                </div>
              </form>
            )}

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
              <select value={quotaFilter.destinationId} onChange={e => setQuotaFilter(f => ({ ...f, destinationId: e.target.value }))}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                <option value="">Semua Destinasi</option>
                {quotaDestinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input type="date" value={quotaFilter.startDate} onChange={e => setQuotaFilter(f => ({ ...f, startDate: e.target.value }))}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" />
              <input type="date" value={quotaFilter.endDate} onChange={e => setQuotaFilter(f => ({ ...f, endDate: e.target.value }))}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" />
              <button onClick={fetchQuotas} className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition">
                Filter
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                  {['Destinasi','Tanggal','Slot','Total','Reserved','Paid','Tersisa','Aktif','Aksi'].map(h => <th key={h} className="pb-2 font-bold text-left px-2">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-800/50">
                  {quotaLoading ? (
                    <tr><td colSpan={9} className="py-8 text-center text-slate-400 animate-pulse">Memuat kuota...</td></tr>
                  ) : quotas.length === 0 ? (
                    <tr><td colSpan={9} className="py-8 text-center text-slate-400">Tidak ada kuota ditemukan.</td></tr>
                  ) : quotas.map(q => (
                    <tr key={q.id} className="hover:bg-slate-900/40">
                      <td className="py-2 px-2 font-bold text-white">{q.destination_name}</td>
                      <td className="py-2 px-2 font-mono text-amber-300">{q.visit_date}</td>
                      <td className="py-2 px-2 text-slate-300">{q.slot_name || '—'}</td>
                      <td className="py-2 px-2 font-mono">{q.total_quota}</td>
                      <td className="py-2 px-2 font-mono text-amber-300">{q.reserved_quota}</td>
                      <td className="py-2 px-2 font-mono text-emerald-300">{q.paid_quota}</td>
                      <td className="py-2 px-2 font-mono font-bold text-cyan-300">{q.available_quota}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${q.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                          {q.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <button onClick={() => handleToggleQuota(q.id, q.is_active)}
                          className="text-xs font-bold text-amber-400 hover:text-amber-300 transition">
                          {q.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DESTINATIONS ── */}
        {activeTab === 'destinations' && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-base font-bold text-white">Manajemen Destinasi</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {destinations.map(d => (
                <div key={d.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white">{d.name}</h4>
                      <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.status === 'OPEN' ? 'bg-emerald-500/20 text-emerald-300' :
                        d.status === 'LIMITED' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>{d.status}</div>
                    </div>
                    <button onClick={() => setEditDest({ ...d })} className="p-1.5 rounded-lg bg-slate-800 text-amber-400 hover:bg-slate-700 transition">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-400">
                    <div>Domestik Weekday: <span className="text-white font-bold">{formatIDR(d.ticket_price_domestic_weekday)}</span></div>
                    <div>Domestik Weekend: <span className="text-white font-bold">{formatIDR(d.ticket_price_domestic_weekend)}</span></div>
                    <div>WNA Weekday: <span className="text-white font-bold">{formatIDR(d.ticket_price_foreign_weekday)}</span></div>
                    <div>Kapasitas: <span className="text-white font-bold">{d.daily_capacity?.toLocaleString()}</span></div>
                  </div>
                  {d.status_notice && <p className="text-xs text-amber-300 border-t border-slate-800 pt-2">{d.status_notice}</p>}
                </div>
              ))}
            </div>

            {/* Edit Modal */}
            {editDest && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <div className="w-full max-w-lg glass-panel rounded-3xl border border-slate-700 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Edit: {editDest.name}</h3>
                    <button onClick={() => setEditDest(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleSaveDest} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ['Harga Domestik Weekday (Rp)', 'ticket_price_domestic_weekday'],
                        ['Harga Domestik Weekend (Rp)', 'ticket_price_domestic_weekend'],
                        ['Harga WNA Weekday (Rp)', 'ticket_price_foreign_weekday'],
                        ['Harga WNA Weekend (Rp)', 'ticket_price_foreign_weekend'],
                        ['Asuransi (Rp)', 'insurance_fee'],
                        ['Kapasitas Harian', 'daily_capacity'],
                      ].map(([label, key]) => (
                        <div key={key}>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</label>
                          <input type="number" value={editDest[key] || 0}
                            onChange={e => setEditDest(d => ({ ...d, [key]: parseFloat(e.target.value) }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                      <select value={editDest.status} onChange={e => setEditDest(d => ({ ...d, status: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400">
                        <option value="OPEN">OPEN</option>
                        <option value="LIMITED">LIMITED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status Notice</label>
                      <input type="text" maxLength={255} value={editDest.status_notice || ''}
                        onChange={e => setEditDest(d => ({ ...d, status_notice: e.target.value }))}
                        placeholder="Informasi singkat kondisi destinasi..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="submit" disabled={destSaving}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition">
                        {destSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                      <button type="button" onClick={() => setEditDest(null)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition">Batal</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── REFUNDS ── */}
        {activeTab === 'refunds' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-white">Manajemen Refund</h2>
              <div className="flex gap-1">
                {['REQUESTED', 'APPROVED', 'REJECTED'].map(s => (
                  <button key={s} onClick={() => setRefundFilter(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${refundFilter === s ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {refunds.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">Tidak ada permohonan refund berstatus {refundFilter}.</div>
              ) : refunds.map(r => (
                <div key={r.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-white">{r.requester_name} <span className="text-slate-400 font-normal">({r.requester_email})</span></div>
                      <div className="text-amber-300 font-mono">{r.booking_code} — {r.destination_name}</div>
                      <div className="text-slate-300">Kunjungan: {r.visit_date} | Jumlah: <span className="font-bold text-white">{formatIDR(r.amount)}</span></div>
                      <div className="text-slate-400">Bank: {r.bank_name} | Rek: {r.bank_account_number} | a.n. {r.bank_account_holder}</div>
                      <div className="text-slate-400 italic">"{r.reason}"</div>
                    </div>
                    {r.status === 'REQUESTED' && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => { setReviewModal(r); setReviewNotes(''); }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition">
                          Review
                        </button>
                      </div>
                    )}
                    {r.status !== 'REQUESTED' && (
                      <div className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 ${r.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                        {r.status}
                      </div>
                    )}
                  </div>
                  {r.review_notes && <div className="text-xs text-slate-400 border-t border-slate-800 pt-2">Catatan: {r.review_notes}</div>}
                </div>
              ))}
            </div>

            {/* Review Modal */}
            {reviewModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-slate-700 space-y-4">
                  <h3 className="text-sm font-bold text-white">Review Refund: {reviewModal.booking_code}</h3>
                  <div className="text-xs text-slate-400">Jumlah: <span className="text-white font-bold">{formatIDR(reviewModal.amount)}</span></div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Catatan (wajib jika ditolak)</label>
                    <textarea rows={3} value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                      placeholder="Alasan keputusan..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleReviewRefund('APPROVE')} className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition">✓ Setujui</button>
                    <button onClick={() => handleReviewRefund('REJECT')} className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition">✕ Tolak</button>
                    <button onClick={() => setReviewModal(null)} className="px-3 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition">Batal</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── REPORTS ── */}
        {activeTab === 'reports' && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-base font-bold text-white">Laporan Keuangan PNBP</h2>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dari Tanggal</label>
                  <input type="date" value={reportDates.startDate} onChange={e => setReportDates(d => ({ ...d, startDate: e.target.value }))}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sampai Tanggal</label>
                  <input type="date" value={reportDates.endDate} onChange={e => setReportDates(d => ({ ...d, endDate: e.target.value }))}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" />
                </div>
                <button onClick={fetchReports} disabled={reportLoading}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition">
                  {reportLoading ? 'Memuat...' : 'Tampilkan'}
                </button>
                <button onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 transition">
                  <FileDown className="w-3.5 h-3.5" /> Ekspor CSV
                </button>
              </div>

              {reportData && (
                <div className="space-y-4 pt-3 border-t border-slate-800">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <div className="text-slate-400">Total Pendapatan PNBP</div>
                      <div className="text-lg font-black text-amber-400 font-mono mt-1">{formatIDR(reportData.totals?.total_revenue)}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <div className="text-slate-400">Total Transaksi</div>
                      <div className="text-lg font-black text-white font-mono mt-1">{reportData.totals?.total_transactions}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <div className="text-slate-400">Total Pengunjung</div>
                      <div className="text-lg font-black text-emerald-400 font-mono mt-1">{reportData.totals?.total_visitors}</div>
                    </div>
                  </div>
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                      {['Destinasi','Transaksi','Pengunjung','Pendapatan'].map(h => <th key={h} className="pb-2 font-bold text-left">{h}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {(reportData.summary || []).map(s => (
                        <tr key={s.destination_name} className="hover:bg-slate-900/40">
                          <td className="py-2 font-bold text-white">{s.destination_name}</td>
                          <td className="py-2 font-mono">{s.total_transactions}</td>
                          <td className="py-2 font-mono">{s.total_visitors}</td>
                          <td className="py-2 font-mono font-bold text-amber-300">{formatIDR(s.total_revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-base font-bold text-white">Manajemen Pengguna ({userTotal})</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" placeholder="Cari nama/email..." value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
                    className="bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                  {['Nama','Email','Role','Risk Score','Daftar','Status','Aksi'].map(h => <th key={h} className="pb-2 font-bold text-left px-2">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-800/50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-900/40">
                      <td className="py-2 px-2 font-bold text-white">{u.name}</td>
                      <td className="py-2 px-2 text-slate-300">{u.email}</td>
                      <td className="py-2 px-2 font-mono text-amber-300 text-[10px]">{u.primary_role}</td>
                      <td className="py-2 px-2 font-mono text-center">
                        <span className={`font-bold ${(u.latest_risk_score || u.risk_score) >= 70 ? 'text-rose-400' : (u.latest_risk_score || u.risk_score) >= 35 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {u.latest_risk_score ?? u.risk_score ?? 0}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-400 text-[11px]">{u.created_at?.split('T')[0] || '—'}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                          {u.is_active ? 'Aktif' : 'Diblokir'}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <button onClick={() => handleToggleUser(u.id)}
                          className={`text-xs font-bold transition ${u.is_active ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'}`}>
                          {u.is_active ? 'Blokir' : 'Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {userTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-400">Halaman {userPage} dari {userTotalPages}</span>
                <button onClick={() => setUserPage(p => Math.min(userTotalPages, p + 1))} disabled={userPage === userTotalPages}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── SECURITY ── */}
        {activeTab === 'security' && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-base font-bold text-white">Aktivitas Mencurigakan & Anti-Bot</h2>
            <div className="space-y-3">
              {securityEvents.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">Tidak ada risk event aktif.</div>
              ) : securityEvents.map(e => (
                <div key={e.id} className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  e.severity === 'HIGH' ? 'bg-rose-500/5 border-rose-500/30' :
                  e.severity === 'MEDIUM' ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${e.severity === 'HIGH' ? 'text-rose-300' : e.severity === 'MEDIUM' ? 'text-amber-300' : 'text-slate-300'}`}>
                          {e.action_type}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          e.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>{e.severity}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          e.status === 'OPEN' ? 'bg-rose-500/20 text-rose-300 animate-pulse' : 'bg-slate-700 text-slate-400'
                        }`}>{e.status}</span>
                      </div>
                      <div className="text-slate-400">{e.reason}</div>
                      <div className="text-slate-500 font-mono text-[10px]">{e.created_at} | IP: {e.ip_hash}</div>
                    </div>
                    {e.status === 'OPEN' && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => handleUpdateSecurityStatus(e.id, 'RESOLVED')}
                          className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold hover:bg-emerald-500/30 transition">
                          Resolve
                        </button>
                        <button onClick={() => handleUpdateSecurityStatus(e.id, 'FALSE_POSITIVE')}
                          className="px-2 py-1 rounded-lg bg-slate-700 text-slate-300 text-[11px] font-bold hover:bg-slate-600 transition">
                          FP
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
