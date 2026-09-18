import Link from 'next/link';
import { Compass, ArrowLeft, Ticket } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="text-center space-y-6 max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
            <Compass className="w-9 h-9 text-slate-950" />
          </div>
        </div>

        {/* Error Code */}
        <div>
          <div className="text-8xl font-black text-slate-800 font-mono select-none">404</div>
          <h1 className="text-xl font-extrabold text-white -mt-2">Halaman Tidak Ditemukan</h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Halaman yang Anda cari tidak tersedia atau telah dipindahkan.<br />
            Silakan kembali ke beranda TNBTS Digital.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:from-amber-400 transition-all hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <Link
            href="/my-bookings"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-900 hover:text-white transition"
          >
            <Ticket className="w-4 h-4 text-amber-400" />
            <span>Tiket Saya</span>
          </Link>
        </div>

        <p className="text-xs text-slate-600">
          Balai Besar Taman Nasional Bromo Tengger Semeru — Sistem Tiket Resmi
        </p>
      </div>
    </div>
  );
}
