'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, QrCode, CreditCard, CheckCircle2, Copy, Check, ShieldCheck, AlertCircle, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PaymentPage({ params }) {
  const resolvedParams = use(params);
  const bookingCode = resolvedParams.code;
  const router = useRouter();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetch(`/api/bookings/${bookingCode}`);
        const data = await res.json();
        if (data.success && data.booking) {
          setBooking(data.booking);
          // If already paid and has tickets, redirect straight to ticket
          if (data.booking.status === 'PAID' && data.booking.tickets?.length > 0) {
            router.push(`/ticket/${data.booking.tickets[0].ticket_code}`);
          }
        }
      } catch (err) {
        console.error('Failed to load booking:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [bookingCode, router]);

  // 15-min countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleCopyVA = () => {
    if (booking?.payment_code) {
      navigator.clipboard.writeText(booking.payment_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmPayment = async () => {
    if (!booking) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/payments/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memproses pembayaran.');
      }

      // Trigger Celebration Confetti Shower
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#ffffff', '#38bdf8'],
        });
      } catch (e) {}

      // Open the issued digital ticket directly!
      const firstTicket = data.data?.issuedTickets?.[0]?.ticketCode;
      if (firstTicket) {
        setTimeout(() => {
          router.push(`/ticket/${firstTicket}`);
        }, 800);
      } else {
        router.push('/my-bookings');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center text-xs space-y-2">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        <div>Memuat faktur pembayaran resmi TNBTS...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-lg font-bold">Pesanan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-400 mt-1">Kode booking {bookingCode} tidak terdaftar di sistem.</p>
        <Link href="/" className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Gateway Pembayaran PNBP</span>
          </div>
        </div>
      </header>

      {/* Main Payment Container */}
      <main className="max-w-3xl mx-auto w-full p-4 sm:p-8 flex-1 space-y-6">
        
        {/* Countdown Header Card */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Sisa Waktu Pelunasan: <span className="font-mono text-white font-extrabold">{timeFormatted}</span></span>
          </div>
          <div className="text-xs text-slate-400">Total Tagihan Resmi Kas Negara:</div>
          <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
            {formatIDR(booking.total_amount)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Kode Booking: <span className="text-white font-bold">{booking.booking_code}</span>
          </div>
        </div>

        {/* Payment Method Switcher */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setPaymentMethod('QRIS')}
              className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                paymentMethod === 'QRIS'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QRIS Instan (Semua Bank/E-Wallet)</span>
            </button>

            <button
              onClick={() => setPaymentMethod('VA')}
              className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                paymentMethod === 'VA'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Virtual Account</span>
            </button>
          </div>

          {/* QRIS Body */}
          {paymentMethod === 'QRIS' ? (
            <div className="p-6 rounded-2xl bg-white text-slate-950 flex flex-col items-center text-center shadow-xl">
              <div className="font-black text-xs tracking-wider uppercase mb-3">QRIS STANDAR PEMBAYARAN NASIONAL</div>
              <div className="w-56 h-56 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-300 p-2 shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(booking.qr_string || 'TNBTS-QRIS')}`}
                  alt="QRIS Barcode"
                  className="w-52 h-52 object-contain"
                />
              </div>
              <p className="text-xs text-slate-600 mt-3 font-medium">
                Pindai menggunakan BCA Mobile, Livin Mandiri, BRImo, GoPay, OVO, ShopeePay, DANA.
              </p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-left">
              <div className="text-xs text-slate-400">Nomor Rekening Virtual Account (BRI / ATM Bersama):</div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-700">
                <span className="font-mono text-lg font-black text-amber-400">
                  {booking.payment_code || '8801928374659102'}
                </span>
                <button
                  onClick={handleCopyVA}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-bold"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Transfer tepat sesuai nominal hingga digit terakhir agar otomatis terverifikasi sistem.
              </p>
            </div>
          )}

          {/* Prominent Instant Simulation Button */}
          <div className="pt-2 space-y-3">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmPayment}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>{isProcessing ? 'Menerbitkan Tiket Digital...' : '⚡ Konfirmasi Pembayaran (Simulasi Langsung)'}</span>
            </button>
            <p className="text-center text-xs text-emerald-400 font-medium">
              Mode Simulasi Sandbox: Klik tombol hijau di atas untuk melunasi tagihan dan langsung membuka E-Ticket resmi.
            </p>
          </div>
        </div>

        {/* Manifest Rincian Pesanan */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3 text-xs">
          <h3 className="font-bold text-white uppercase tracking-wider text-xs">Rincian Pemesanan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
            <div>Destinasi: <span className="text-white font-bold">{booking.destination_name}</span></div>
            <div>Tanggal: <span className="text-white font-bold">{booking.visit_date}</span></div>
            <div>Pintu Masuk: <span className="text-white font-bold">{booking.entrance_gate}</span></div>
            <div>Kendaraan: <span className="text-white font-bold">{booking.vehicle_type}</span></div>
          </div>
        </div>

      </main>
    </div>
  );
}
