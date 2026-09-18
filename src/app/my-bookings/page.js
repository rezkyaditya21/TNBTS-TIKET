'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Ticket, Calendar, MapPin, Users, CheckCircle2, Clock, AlertTriangle, QrCode } from 'lucide-react';
import TicketViewModal from '@/components/TicketViewModal.jsx';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketCode, setSelectedTicketCode] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 font-sans">
      {/* Top Navigation */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between pb-4 border-b border-slate-800">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <h1 className="text-sm font-bold text-white flex items-center gap-2">
          <Ticket className="w-4 h-4 text-amber-400" />
          <span>Riwayat Booking &amp; Tiket Saya</span>
        </h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          <div className="py-24 text-center text-xs text-slate-400 animate-pulse">
            Memuat daftar tiket dan riwayat pesanan...
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-3">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Belum Ada Riwayat Pemesanan</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Anda belum melakukan booking tiket kunjungan Bromo Tengger Semeru.
            </p>
            <Link
              href="/"
              className="inline-block mt-3 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20"
            >
              Pesan Tiket Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="glass-card p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-amber-400">{b.booking_code}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        b.status === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : b.status === 'RESERVED'
                          ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {b.status === 'PAID' ? 'LUNAS (TIKET AKTIF)' : b.status === 'RESERVED' ? 'MENUNGGU PEMBAYARAN' : b.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">Dipesan pada {b.created_at}</div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-base font-black text-white font-mono">{formatIDR(b.total_amount)}</div>
                    <div className="text-[11px] text-slate-400">{b.total_visitors} Orang • {b.vehicle_type}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{b.destination_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Kunjungan: {b.visit_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pintu: {b.entrance_gate}</span>
                  </div>
                </div>

                {b.status === 'PAID' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={async () => {
                        // Get ticket code from booking detail
                        const res = await fetch(`/api/bookings/${b.id}`);
                        const resData = await res.json();
                        if (resData.success && resData.booking.tickets?.length > 0) {
                          setSelectedTicketCode(resData.booking.tickets[0].ticket_code);
                        } else {
                          alert('Tiket sedang disinkronkan, silakan coba sesaat lagi.');
                        }
                      }}
                      className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Buka Tiket &amp; QR Dinamis</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      {selectedTicketCode && (
        <TicketViewModal
          isOpen={Boolean(selectedTicketCode)}
          onClose={() => setSelectedTicketCode(null)}
          ticketCode={selectedTicketCode}
          onOpenScannerWithTicket={(code, token) => {
            window.location.href = `/scanner`;
          }}
        />
      )}
    </div>
  );
}
