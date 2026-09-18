'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Compass, LogOut, Ticket, Bell, X, User } from 'lucide-react';

export default function Navbar({ currentUser, onOpenLogin, onLogout, systemStatus = 'OPEN' }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch unread count when user is logged in
  useEffect(() => {
    if (!currentUser) { setUnreadCount(0); setNotifications([]); return; }
    async function fetchCount() {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (data.success) {
          setUnreadCount(data.unreadCount || 0);
          setNotifications(data.notifications || []);
        }
      } catch {}
    }
    fetchCount();
    // Poll every 60s
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenNotif = async () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen && unreadCount > 0) {
      try {
        await fetch('/api/notifications/read-all', { method: 'POST' });
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      } catch {}
    }
  };

  const statusColors = {
    OPEN: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    LIMITED: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    CLOSED: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  };
  const statusLabels = {
    OPEN: 'Kawasan Buka Normal',
    LIMITED: 'Akses Terbatas',
    CLOSED: 'Kawasan Ditutup Sementara',
  };

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'glass-panel shadow-2xl py-3' : 'bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg text-white font-sans">
                  TNBTS <span className="text-amber-400">DIGITAL</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Resmi
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Balai Besar Taman Nasional Bromo Tengger Semeru
              </p>
            </div>
          </Link>

          {/* Status Badge */}
          <div className={`hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-semibold ${statusColors[systemStatus] || statusColors.OPEN}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
            <span>{statusLabels[systemStatus] || 'Kawasan Buka'}</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a href="#destinasi" className="hover:text-amber-400 transition-colors">Destinasi & Kuota</a>
          <a href="#keamanan-calo" className="hover:text-amber-400 transition-colors">Sistem Anti-Calo</a>
          <Link href="/status" className="hover:text-amber-400 transition-colors">Status Kawasan</Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">

          <Link href="/my-bookings" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 transition">
            <Ticket className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Tiket Saya</span>
          </Link>

          {currentUser && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={handleOpenNotif}
                className="relative p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Notifikasi"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-10 w-80 glass-panel rounded-2xl border border-slate-700 shadow-2xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                    <span className="text-xs font-bold text-white">Notifikasi</span>
                    <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-400">Belum ada notifikasi.</div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div key={n.id} className={`px-4 py-3 text-xs hover:bg-slate-800/40 transition ${!n.is_read ? 'bg-amber-500/5 border-l-2 border-amber-400' : ''}`}>
                          <div className="font-bold text-white">{n.title}</div>
                          <div className="text-slate-400 mt-0.5 line-clamp-2">{n.message}</div>
                          <div className="text-[10px] text-slate-500 mt-1">{timeAgo(n.created_at)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2">
              <Link href="/profile" className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-semibold px-2 py-1.5 rounded-xl hover:bg-slate-800 transition">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentUser.name}</span>
              </Link>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="text-xs text-slate-300 hover:text-white font-semibold px-3 py-1.5 rounded-xl hover:bg-slate-900 transition"
            >
              Masuk
            </button>
          )}

          <Link
            href="/booking"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          >
            <span>Pesan Tiket</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
