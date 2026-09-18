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

        {/* User Account / Navigation Actions */}
        <div className="flex items-center gap-3">
          
          <Link
            href="/my-bookings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 text-slate-200 text-xs font-bold border border-slate-800 transition"
          >
            <Ticket className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Tiket Saya</span>
          </Link>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-semibold hidden md:inline">
                {currentUser.name}
              </span>
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
