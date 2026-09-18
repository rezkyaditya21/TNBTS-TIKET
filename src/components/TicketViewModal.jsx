'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, QrCode, Download, RefreshCw, MapPin, Calendar, User, Compass, Sparkles, CheckCircle2 } from 'lucide-react';

export default function TicketViewModal({ isOpen, onClose, ticketCode, onOpenScannerWithTicket }) {
  const [ticketData, setTicketData] = useState(null);
  const [securityData, setSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(45);

  const fetchTicket = async () => {
    if (!ticketCode) return;
    try {
      const res = await fetch(`/api/tickets/${ticketCode}`);
      const data = await res.json();
      if (data.success) {
        setTicketData(data.ticket);
        setSecurityData(data.dynamicSecurity);
        setSecondsRemaining(data.dynamicSecurity.secondsRemaining || 45);
      }
    } catch (err) {
      console.error('Failed to load ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !ticketCode) return;
    fetchTicket();

    // Refresh rolling token countdown every second
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          fetchTicket(); // refresh token when window expires
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, ticketCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Balai Besar TNBTS</span>
              <h3 className="text-sm font-bold text-white">E-Ticket Digital Resmi</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-center">
          {loading ? (
            <div className="py-16 text-xs text-slate-400 animate-pulse">Memuat tiket digital berenkripsi...</div>
          ) : ticketData ? (
            <>
              {/* Status Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{ticketData.status === 'USED' ? 'TIKET TELAH DIGUNAKAN' : 'TIKET RESMI & AKTIF'}</span>
              </div>

              {/* Dynamic Rolling QR Box */}
              <div className="p-5 rounded-3xl bg-white text-slate-950 flex flex-col items-center shadow-xl border border-slate-200 relative overflow-hidden">
                <div className="w-full flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-500 border-b border-slate-200 pb-2 mb-3">
                  <span>KODE: {ticketData.ticketCode}</span>
                  <span className="text-amber-600 font-mono">TNBTS DIGITAL</span>
                </div>

                {securityData?.qrDataUrl ? (
                  <img
                    src={securityData.qrDataUrl}
                    alt="Dynamic Ticket QR"
                    className="w-52 h-52 object-contain"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                    Membuat QR Dinamis...
                  </div>
                )}

                {/* Animated 45-Second Rotation Bar */}
                <div className="w-full mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    <span>QR Berganti Dalam:</span>
                  </div>
                  <span className="font-mono font-extrabold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                    {secondsRemaining}s
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-amber-500 h-full transition-all duration-1000"
                    style={{ width: `${(secondsRemaining / 45) * 100}%` }}
                  />
                </div>

                <div className="text-[10px] text-slate-400 mt-2 font-medium">
                  Dilindungi token dinamis HMAC. Screenshot tidak akan berlaku di pos gerbang.
                </div>
              </div>

              {/* Ticket Details Grid */}
              <div className="glass-card p-4 rounded-2xl border border-slate-800 text-left space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Nama Pengunjung:</span>
                  <span className="font-bold text-white uppercase">{ticketData.visitorName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Nomor NIK / Paspor:</span>
                  <span className="font-mono text-amber-300 font-bold">{ticketData.identityNumber}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Destinasi:</span>
                  <span className="font-bold text-white">{ticketData.destinationName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Tanggal Kunjungan:</span>
                  <span className="font-bold text-white">{ticketData.visitDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pintu Masuk:</span>
                  <span className="font-bold text-emerald-400">{ticketData.entranceGate}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenScannerWithTicket(ticketData.ticketCode, securityData?.token);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Uji Scan di Pos Gerbang</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-xs text-rose-400">Tiket tidak ditemukan.</div>
          )}
        </div>

      </div>
    </div>
  );
}
