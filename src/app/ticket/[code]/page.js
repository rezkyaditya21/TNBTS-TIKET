'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass, Printer, QrCode, ShieldCheck, CheckCircle2, AlertTriangle, Clock, MapPin, Calendar, Users, Sparkles } from 'lucide-react';

export default function TicketDetailPage({ params }) {
  const resolvedParams = use(params);
  const ticketCode = resolvedParams.code;

  const [ticketData, setTicketData] = useState(null);
  const [securityData, setSecurityData] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(45);
  const [loading, setLoading] = useState(true);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketCode}`);
      const data = await res.json();
      if (data.success && data.ticket) {
        setTicketData(data.ticket);
        setSecurityData(data.dynamicSecurity);
        setSecondsRemaining(data.dynamicSecurity?.secondsRemaining || 45);
      }
    } catch (err) {
      console.error('Failed to load ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketCode]);

  // Rolling countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          fetchTicket();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center text-xs space-y-2">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <div>Memverifikasi tiket digital resmi...</div>
      </div>
    );
  }

  if (!ticketData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-lg font-bold">Tiket Tidak Ditemukan</h2>
        <p className="text-xs text-slate-400 mt-1">Kode tiket {ticketCode} tidak terdaftar di sistem balai.</p>
        <Link href="/" className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const isUsed = ticketData.status === 'USED';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Bar (Hidden on print) */}
      <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 backdrop-blur-md print:hidden">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Beranda</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan</span>
            </button>
            <Link
              href="/scanner"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Uji di Scanner</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Ticket Card Container */}
      <main className="max-w-xl mx-auto w-full p-4 sm:p-8 flex-1 flex flex-col justify-center">
        
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
          
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 p-5 text-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-bold">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-900/80">Kementerian LHK RI</div>
                <div className="text-base font-black tracking-tight leading-tight">E-TICKET RESMI TNBTS</div>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
              isUsed ? 'bg-slate-800 text-slate-300' : 'bg-slate-950 text-emerald-400 border border-emerald-500/40'
            }`}>
              {isUsed ? 'SUDAH DISCAN' : 'TIKET AKTIF'}
            </span>
          </div>

          {/* Dynamic QR Code Section */}
          <div className="p-6 bg-slate-900/60 border-b border-slate-800 flex flex-col items-center text-center">
            
            <div className="relative p-3 bg-white rounded-2xl shadow-xl">
              {securityData?.qrDataUrl ? (
                <img
                  src={securityData.qrDataUrl}
                  alt="Dynamic QR Code"
                  className="w-56 h-56 object-contain"
                />
              ) : (
                <div className="w-56 h-56 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                  Membuat QR Dinamis...
                </div>
              )}

              {/* Status Watermark if Used */}
              {isUsed && (
                <div className="absolute inset-0 bg-slate-950/80 rounded-2xl flex flex-col items-center justify-center text-rose-400 p-4">
                  <AlertTriangle className="w-12 h-12" />
                  <span className="font-black text-sm uppercase mt-2">TIKET TELAH DIGUNAKAN</span>
                  <span className="text-[10px] text-slate-400 mt-1">Check-in: {ticketData.usedAt}</span>
                </div>
              )}
            </div>

            {/* Rolling Security Ring (Only when Active) */}
            {!isUsed && (
              <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Token QR Berotasi: <span className="font-mono text-white font-extrabold">{secondsRemaining}s</span></span>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-2">
              Tunjukkan barcode ini langsung dari layar HP Anda saat tiba di pos pintu masuk.
            </p>
          </div>

          {/* Ticket Credentials */}
          <div className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Nama Pengunjung</div>
                <div className="text-sm font-bold text-white mt-0.5">{ticketData.visitorName}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Nomor NIK / Identitas</div>
                <div className="text-sm font-mono text-amber-300 mt-0.5">{ticketData.identityNumber}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Site Destinasi</div>
                <div className="font-bold text-white mt-0.5">{ticketData.destinationName}</div>
                <div className="text-[10px] text-slate-400">{ticketData.locationZone}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Tanggal Kunjungan</div>
                <div className="font-bold text-white mt-0.5">{ticketData.visitDate}</div>
                <div className="text-[10px] text-emerald-400 font-semibold">{ticketData.slotName || 'Sunrise Spot'}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Pintu Masuk Resmi</div>
                <div className="font-bold text-cyan-300 mt-0.5">{ticketData.entranceGate}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Kode Tiket</div>
                <div className="font-mono text-slate-300 mt-0.5 font-bold">{ticketData.ticketCode}</div>
              </div>
            </div>
          </div>

          {/* Footer Card */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-center text-[10px] text-slate-500">
            Balai Besar Taman Nasional Bromo Tengger Semeru • Wajib Menunjukkan KTP Asli di Gerbang
          </div>

        </div>

      </main>
    </div>
  );
}
