'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, QrCode, CreditCard, ShieldCheck, CheckCircle2, Sparkles, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PaymentModal({ isOpen, onClose, reservationData, onPaymentSuccess }) {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins in seconds
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('QRIS');

  useEffect(() => {
    if (!isOpen || !reservationData?.expiresAt) return;

    const expiresTime = new Date(reservationData.expiresAt).getTime();
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, reservationData]);

  if (!isOpen || !reservationData) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const handleCopyVA = () => {
    if (reservationData.paymentCode) {
      navigator.clipboard.writeText(reservationData.paymentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/payments/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: reservationData.bookingId,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memproses pembayaran.');
      }

      // Celebrate with gold & emerald confetti shower!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#ffffff', '#fbbf24'],
        });
      } catch (e) {}

      onPaymentSuccess(data.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md glass-panel rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Gateway Pembayaran PNBP</span>
            <h3 className="text-base font-bold text-white mt-0.5">Selesaikan Pembayaran</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-center">
          
          {/* Countdown Clock */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <span className="text-xs text-amber-300 font-medium">Batas Waktu Pembayaran: </span>
              <span className="text-base font-extrabold font-mono text-white">{timeFormatted}</span>
            </div>
          </div>

          {/* Amount Due */}
          <div>
            <div className="text-xs text-slate-400">Total Tagihan Resmi:</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
              {formatIDR(reservationData.totalAmount)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Kode Booking: {reservationData.bookingCode}
            </div>
          </div>

          {/* Method Selection */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <button
              onClick={() => setPaymentMethod('QRIS')}
              className={`py-2 px-3 rounded-xl border transition flex items-center justify-center gap-1.5 ${
                paymentMethod === 'QRIS'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QRIS Instan</span>
            </button>

            <button
              onClick={() => setPaymentMethod('VA_BRI')}
              className={`py-2 px-3 rounded-xl border transition flex items-center justify-center gap-1.5 ${
                paymentMethod === 'VA_BRI'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Virtual Account</span>
            </button>
          </div>

          {/* Method Details */}
          {paymentMethod === 'QRIS' ? (
            <div className="p-4 rounded-2xl bg-white text-slate-950 flex flex-col items-center shadow-lg">
              <div className="font-bold text-xs tracking-wider mb-2">QRIS STANDAR NASIONAL</div>
              {/* QR Image Box */}
              <div className="w-44 h-44 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-300 relative overflow-hidden">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(reservationData.qrString || 'TNBTS-QRIS')}`}
                  alt="QRIS Code"
                  className="w-40 h-40 object-contain"
                />
              </div>
              <p className="text-[10px] text-slate-600 mt-2">
                Dapat dipindai dengan BCA, Mandiri, BRI, GoPay, OVO, ShopeePay, DANA.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2">
              <div className="text-[11px] text-slate-400">Nomor Virtual Account (BRI / ATM Bersama):</div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-700">
                <span className="font-mono text-base font-bold text-amber-400">
                  {reservationData.paymentCode || '8801928374659102'}
                </span>
                <button
                  onClick={handleCopyVA}
                  className="text-slate-400 hover:text-white p-1"
                  title="Salin Nomor VA"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Lakukan transfer tepat sesuai nominal hingga 3 digit terakhir.
              </p>
            </div>
          )}

          {/* Instant Sandbox Payment Confirmation Button */}
          <div className="pt-2">
            <button
              disabled={isProcessing || timeLeft <= 0}
              onClick={handleSimulatePayment}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>{isProcessing ? 'Menerbitkan Tiket...' : '⚡ Konfirmasi Pembayaran (Simulasi Langsung)'}</span>
            </button>
            <p className="text-[11px] text-emerald-400/90 mt-2 font-medium">
              Mode Simulasi Aktif: Klik tombol hijau di atas untuk langsung melunasi dan menerbitkan E-Ticket resmi seketika.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
