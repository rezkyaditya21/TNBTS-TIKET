'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Ticket, Calendar, MapPin, Clock, QrCode, Users, RefreshCw, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import TicketViewModal from '@/components/TicketViewModal.jsx';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketCode, setSelectedTicketCode] = useState(null);
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [ticketListByBooking, setTicketListByBooking] = useState({});
  const [ticketListLoading, setTicketListLoading] = useState({});

  // Refund state
  const [refundModal, setRefundModal] = useState(null); // booking object
  const [refundForm, setRefundForm] = useState({ reason: '', bankName: '', bankAccountNumber: '', bankAccountHolder: '' });
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.success) setBookings(data.bookings || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const formatIDR = (val) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(val);

  const loadTickets = async (bookingId) => {
    if (ticketListByBooking[bookingId]) return; // already loaded
    setTicketListLoading(prev => ({ ...prev, [bookingId]: true }));
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      const data = await res.json();
      if (data.success) {
        setTicketListByBooking(prev => ({ ...prev, [bookingId]: data.booking.tickets || [] }));
      }
    } catch {}
    finally {
      setTicketListLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleToggleTickets = async (bookingId) => {
    if (expandedBooking === bookingId) {
      setExpandedBooking(null);
    } else {
      setExpandedBooking(bookingId);
      await loadTickets(bookingId);
    }
  };

  const handleSubmitRefund = async () => {
    if (!refundModal) return;
    setRefundLoading(true);
    setRefundError('');
    try {
      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: refundModal.id, ...refundForm }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mengajukan refund.');
      setRefundModal(null);
      setRefundForm({ reason: '', bankName: '', bankAccountNumber: '', bankAccountHolder: '' });
      fetchBookings();
      alert('Permohonan refund berhasil diajukan!');
    } catch (err) {
      setRefundError(err.message);
    } finally {
      setRefundLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const statusBadge = (status) => {
    const map = {
      PAID: 'bg-emerald-500/20 text-emerald-300',
      RESERVED: 'bg-amber-500/20 text-amber-300 animate-pulse',
      CANCELLED: 'bg-rose-500/20 text-rose-300',
      REFUNDED: 'bg-violet-500/20 text-violet-300',
    };
    const labels = {
      PAID: 'LUNAS (TIKET AKTIF)',
      RESERVED: 'MENUNGGU PEMBAYARAN',
      CANCELLED: 'DIBATALKAN',
      REFUNDED: 'DIKEMBALIKAN',
    };
    return { cls: map[status] || 'bg-slate-700 text-slate-300', label: labels[status] || status };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between pb-4 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition">
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
          <div className="py-24 text-center text-xs text-slate-400 animate-pulse">Memuat daftar tiket dan riwayat pesanan...</div>
        ) : bookings.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-3">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Belum Ada Riwayat Pemesanan</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">Anda belum melakukan booking tiket kunjungan Bromo Tengger Semeru.</p>
            <Link href="/" className="inline-block mt-3 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20">
              Pesan Tiket Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const badge = statusBadge(b.status);
              const tickets = ticketListByBooking[b.id] || [];
              const isExpanded = expandedBooking === b.id;
              const canRefund = b.status === 'PAID' && b.visit_date > today;

              return (
                <div key={b.id} className="glass-card p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition space-y-4">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-black text-amber-400">{b.booking_code}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Dipesan pada {b.created_at}</div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-base font-black text-white font-mono">{formatIDR(b.total_amount)}</div>
                      <div className="text-[11px] text-slate-400">{b.total_visitors} Orang • {b.vehicle_type}</div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-amber-400" /><span>{b.destination_name}</span></div>
                    <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-amber-400" /><span>Kunjungan: {b.visit_date}</span></div>
                    <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-amber-400" /><span>Pintu: {b.entrance_gate}</span></div>
                  </div>

                  {/* Actions */}
                  {b.status === 'PAID' && (
                    <div className="pt-2 flex flex-wrap gap-2 justify-end">
                      {canRefund && (
                        <button
                          onClick={() => { setRefundModal(b); setRefundError(''); }}
                          className="py-2 px-3 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 font-bold text-xs flex items-center gap-1.5 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Ajukan Refund</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleTickets(b.id)}
                        className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>
                          {ticketListLoading[b.id]
                            ? 'Memuat...'
                            : `${b.total_visitors > 1 ? b.total_visitors + ' Tiket' : 'Buka Tiket'} QR`}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {/* Tiket list — expanded */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 pt-3 space-y-2">
                      {ticketListLoading[b.id] ? (
                        <div className="text-xs text-slate-400 animate-pulse text-center py-3">Memuat tiket...</div>
                      ) : tickets.length === 0 ? (
                        <div className="text-xs text-slate-400 text-center py-3">Tiket belum diterbitkan.</div>
                      ) : (
                        tickets.map((t) => (
                          <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
                            <div className="space-y-0.5">
                              <div className="font-bold text-white">{t.visitor_name}</div>
                              <div className="text-slate-400 font-mono">{t.identity_number}</div>
                              <div className="font-mono text-amber-400 text-[11px]">{t.ticket_code}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                t.status === 'ISSUED' ? 'bg-emerald-500/20 text-emerald-300'
                                : t.status === 'USED' ? 'bg-slate-600 text-slate-300'
                                : 'bg-rose-500/20 text-rose-300'
                              }`}>{t.status}</span>
                              {t.status === 'ISSUED' && (
                                <button
                                  onClick={() => setSelectedTicketCode(t.ticket_code)}
                                  className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition"
                                  title="Buka QR"
                                >
                                  <QrCode className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Reserved — payment link */}
                  {b.status === 'RESERVED' && (
                    <div className="pt-2 flex justify-end">
                      <Link
                        href={`/payment/${b.booking_code}`}
                        className="py-2.5 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
                      >
                        <span>Lanjutkan Pembayaran</span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket QR Modal */}
      {selectedTicketCode && (
        <TicketViewModal
          isOpen={Boolean(selectedTicketCode)}
          onClose={() => setSelectedTicketCode(null)}
          ticketCode={selectedTicketCode}
        />
      )}

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel rounded-3xl border border-slate-700 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Ajukan Permohonan Refund</h3>
              <button onClick={() => setRefundModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">Booking: <span className="font-mono font-bold text-amber-400">{refundModal.booking_code}</span> — {formatIDR(refundModal.total_amount)}</p>

            {refundError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{refundError}</div>
            )}

            <div className="space-y-3">
              {[
                { label: 'Alasan Refund', key: 'reason', placeholder: 'Tuliskan alasan pembatalan...', textarea: true },
                { label: 'Nama Bank', key: 'bankName', placeholder: 'Contoh: BCA, Mandiri, BNI' },
                { label: 'Nomor Rekening', key: 'bankAccountNumber', placeholder: 'Nomor rekening tujuan refund' },
                { label: 'Nama Pemilik Rekening', key: 'bankAccountHolder', placeholder: 'Sesuai nama di buku tabungan' },
              ].map(({ label, key, placeholder, textarea }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{label}</label>
                  {textarea ? (
                    <textarea
                      rows={3}
                      placeholder={placeholder}
                      value={refundForm[key]}
                      onChange={(e) => setRefundForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={refundForm[key]}
                      onChange={(e) => setRefundForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              disabled={refundLoading}
              onClick={handleSubmitRefund}
              className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition flex items-center justify-center gap-2"
            >
              {refundLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              <span>{refundLoading ? 'Memproses...' : 'Kirim Permohonan Refund'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
