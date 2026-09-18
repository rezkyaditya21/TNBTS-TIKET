'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar.jsx';
import HeroSection from '@/components/HeroSection.jsx';
import DestinationsCatalog from '@/components/DestinationsCatalog.jsx';
import AntiScalperFeatureSection from '@/components/AntiScalperFeatureSection.jsx';
import BookingWizardModal from '@/components/BookingWizardModal.jsx';
import PaymentModal from '@/components/PaymentModal.jsx';
import TicketViewModal from '@/components/TicketViewModal.jsx';
import AuthModal from '@/components/AuthModal.jsx';
import { Shield, Sparkles, CheckCircle2, AlertTriangle, HelpCircle, Phone, Mail, Compass, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [systemStatus, setSystemStatus] = useState('OPEN');
  const [systemNotice, setSystemNotice] = useState('');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedBookingDestId, setSelectedBookingDestId] = useState('');
  const [selectedBookingDate, setSelectedBookingDate] = useState('');
  const [reservationPayload, setReservationPayload] = useState(null);
  const [activeTicketCode, setActiveTicketCode] = useState(null);

  // Load Current User & Destinations
  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, destRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/destinations'),
        ]);

        const meData = await meRes.json();
        if (meData.success && meData.user) {
          setCurrentUser(meData.user);
        }

        const destData = await destRes.json();
        if (destData.success) {
          setDestinations(destData.destinations || []);
          setSystemStatus(destData.systemStatus || 'OPEN');
          setSystemNotice(destData.systemNotice || '');
        }
      } catch (err) {
        console.error('Initial load error:', err);
      }
    }
    loadData();
  }, []);

  const handleLogout = () => {
    document.cookie = 'tnbts_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setCurrentUser(null);
  };

  const handleQuickRoleSwitch = async (email) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Bromo2026!' }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
      }
    } catch (err) {
      alert('Gagal berganti role.');
    }
  };

  const handleStartBooking = (destId, date) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setSelectedBookingDestId(destId);
    setSelectedBookingDate(date);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenLogin={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onSelectRoleQuickSwitch={handleQuickRoleSwitch}
        systemStatus={systemStatus}
      />

      {/* Hero Section */}
      <HeroSection
        destinations={destinations}
        onStartBooking={handleStartBooking}
        systemStatus={systemStatus}
        systemNotice={systemNotice}
      />

      {/* Destinations Catalog */}
      <DestinationsCatalog
        destinations={destinations}
        onSelectDestination={(id) => handleStartBooking(id, new Date().toISOString().split('T')[0])}
      />

      {/* Anti-Scalper Security Pillars */}
      <AntiScalperFeatureSection />

      {/* Alur Reservasi & Aturan Kunjungan */}
      <section id="alur-tiket" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Compass className="w-3.5 h-3.5" />
            Alur Pemesanan Resmi 2026
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Bagaimana Sistem Bekerja Melindungi Anda?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Hanya 4 langkah cepat untuk mendapatkan tiket resmi tanpa perantara calo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Pilih Spot & Tanggal', desc: 'Pilih lokasi matahari terbit dan periksa sisa kuota yang terverifikasi secara real-time.' },
            { step: '02', title: 'Kunci Kuota 15 Menit', desc: 'Masukkan identitas NIK asli rombongan. Kuota dikunci aman agar tidak bisa direbut pengguna lain.' },
            { step: '03', title: 'Bayar Instan QRIS/VA', desc: 'Selesaikan transaksi resmi ke kas negara PNBP tanpa biaya perantara gelap.' },
            { step: '04', title: 'Terima E-Ticket Dinamis', desc: 'Tiket aktif berputar otomatis setiap 45 detik. Tunjukkan smartphone di pos gerbang.' },
          ].map((item, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl border border-slate-800 relative">
              <div className="font-mono text-3xl font-black text-amber-500/40 mb-3">{item.step}</div>
              <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rules & Guidelines */}
      <section id="informasi" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Aturan Wajib Masuk Kawasan TNBTS</h3>
              <p className="text-xs text-slate-400">Patuhi demi keselamatan bersama dan kelestarian ekosistem taman nasional.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">1</span>
              <span>Wajib membawa kartu identitas asli (KTP/Paspor) yang sesuai dengan nama pada tiket saat pemeriksaan di gerbang.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">2</span>
              <span>Dilarang keras menyalakan api unggun, kembang api, petasan, atau flare di seluruh kawasan kaldera & savana.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">3</span>
              <span>Batas aman pendakian kawah Bromo adalah radius 1 km dari bibir kawah aktif pada status Waspada Level II.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">4</span>
              <span>Bawa kembali sampah Anda (*Zero Waste*). Pelanggar jalur tikus akan dijatuhi sanksi blacklist kawasan konservasi se-Indonesia.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">TNBTS DIGITAL INDONESIA</div>
              <div className="text-[11px] text-slate-500">Kementerian Lingkungan Hidup dan Kehutanan Republik Indonesia</div>
            </div>
          </div>

          <div className="text-center sm:text-right text-xs text-slate-500 space-y-1">
            <p>© 2026 Balai Besar Taman Nasional Bromo Tengger Semeru.</p>
            <p>Sistem Pemesanan Tiket Online Anti-Monopoli &amp; Anti-Calo.</p>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />

      <BookingWizardModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialDestinationId={selectedBookingDestId}
        initialDate={selectedBookingDate}
        destinations={destinations}
        onBookingSuccess={(resData) => {
          setIsBookingOpen(false);
          setReservationPayload(resData);
        }}
      />

      {reservationPayload && (
        <PaymentModal
          isOpen={Boolean(reservationPayload)}
          onClose={() => setReservationPayload(null)}
          reservationData={reservationPayload}
          onPaymentSuccess={async (paymentResult) => {
            setReservationPayload(null);
            if (paymentResult.issuedTickets?.length > 0) {
              setActiveTicketCode(paymentResult.issuedTickets[0].ticketCode);
            }
          }}
        />
      )}

      {activeTicketCode && (
        <TicketViewModal
          isOpen={Boolean(activeTicketCode)}
          onClose={() => setActiveTicketCode(null)}
          ticketCode={activeTicketCode}
          onOpenScannerWithTicket={(code, token) => {
            window.location.href = `/scanner`;
          }}
        />
      )}

    </div>
  );
}
