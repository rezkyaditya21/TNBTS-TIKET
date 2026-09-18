'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Compass, Shield, User, LogOut, Ticket, QrCode, LayoutDashboard, ChevronDown } from 'lucide-react';

export default function Navbar({ currentUser, onOpenLogin, onLogout, onSelectRoleQuickSwitch, systemStatus = 'OPEN' }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'glass-panel shadow-2xl py-3' : 'bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Logo & Status */}
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

          {/* Real-time Status Badge */}
          <div className={`hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-semibold ${statusColors[systemStatus] || statusColors.OPEN}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
            <span>{statusLabels[systemStatus] || 'Kawasan Buka'}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a href="#destinasi" className="hover:text-amber-400 transition-colors">Destinasi & Kuota</a>
          <a href="#keamanan-calo" className="hover:text-amber-400 transition-colors">Sistem Anti-Calo</a>
          <a href="#alur-tiket" className="hover:text-amber-400 transition-colors">Alur Reservasi</a>
          <a href="#informasi" className="hover:text-amber-400 transition-colors">Aturan Kawasan</a>
        </nav>

        {/* User Account / Role Switcher Demo */}
        <div className="flex items-center gap-3">
          
          {/* Quick Role Switcher (Crucial for Reviewing All 5 Roles seamlessly) */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition"
              title="Ganti Role Cepat untuk Pengujian"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Role:</span>
              <span className="text-amber-300 uppercase font-mono">{currentUser ? currentUser.role : 'GUEST'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 glass-panel rounded-2xl shadow-2xl p-2.5 z-50 text-xs border border-slate-700/80 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex justify-between items-center">
                  <span>Pilih Mode Akses</span>
                  <span className="text-[10px] text-amber-400">3 Role Simpel</span>
                </div>
                <div className="space-y-1.5 mt-2">
                  {[
                    { role: 'PENGUNJUNG', name: 'Wisatawan (Rezky)', email: 'wisatawan@gmail.com', desc: 'Booking tiket, bayar QRIS, & lihat QR dinamis' },
                    { role: 'PETUGAS', name: 'Petugas Ranger Gerbang', email: 'petugas@tnbts.go.id', desc: 'Pemeriksaan & scan QR di pos pintu masuk' },
                    { role: 'ADMIN_TNBTS', name: 'Pengelola Balai TNBTS', email: 'admin@tnbts.go.id', desc: 'Kontrol kuota, status kawasan, & rekap PNBP' },
                  ].map(r => (
                    <button
                      key={r.role}
                      onClick={() => {
                        onSelectRoleQuickSwitch(r.email);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition flex flex-col ${
                        currentUser?.role === r.role ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'hover:bg-slate-800/80 text-slate-200 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{r.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300">{r.role}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 leading-snug">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Action / Profile */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              {['PETUGAS', 'SUPER_ADMIN'].includes(currentUser.role) && (
                <Link
                  href="/scanner"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Buka Scanner</span>
                </Link>
              )}

              {['ADMIN_TNBTS', 'SUPER_ADMIN', 'OPERATOR_KEUANGAN'].includes(currentUser.role) && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dashboard Admin</span>
                </Link>
              )}

              <Link
                href="/my-bookings"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <Ticket className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Tiket Saya</span>
              </Link>

              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
            >
              <User className="w-3.5 h-3.5" />
              <span>Masuk / Daftar</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
