'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Phone, Mail, MapPin, ShieldAlert, Sparkles } from 'lucide-react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Apakah saya wajib mencetak (print) tiket di kertas fisik?',
      a: 'Tidak perlu sama sekali! Sistem baru TNBTS 2026 berbasis Dynamic E-Ticket. Anda cukup membuka tiket langsung di layar smartphone Anda saat tiba di pos gerbang masuk. Barcode QR dinamis akan berotasi otomatis setiap 45 detik untuk memastikan keaslian tiket.',
    },
    {
      q: 'Bagaimana jika baterai smartphone saya habis saat di pintu gerbang?',
      a: 'Jangan panik. Petugas gerbang memiliki fitur pencarian darurat offline. Cukup tunjukkan kartu identitas fisik (KTP/Paspor) asli ketua rombongan, petugas pos akan memverifikasi manifest pengunjung terdaftar secara langsung.',
    },
    {
      q: 'Berapa lama kuota tiket dikunci saat saya mengisi data pemesanan?',
      a: 'Sistem mengunci kuota selama tepat 15 menit sejak tombol "Kunci Kuota & Bayar" ditekan. Selama 15 menit tersebut, kuota Anda 100% aman dan tidak bisa direbut orang lain. Jika tidak lunas dalam 15 menit, kuota otomatis kembali ke publik.',
    },
    {
      q: 'Apakah 1 orang bisa membelikan tiket untuk rombongan keluarga/teman?',
      a: 'Bisa! Dalam 1 transaksi, ketua rombongan dapat memesan hingga maksimal 8 orang sekaligus. Namun, setiap orang wajib diisi nama lengkap dan nomor NIK KTP/Paspor masing-masing yang valid.',
    },
    {
      q: 'Bagaimana kebijakan tiket jika terjadi erupsi vulkanik atau cuaca ekstrem?',
      a: 'Jika Balai Besar TNBTS mengumumkan penutupan darurat kawasan demi keselamatan, tiket Anda dijamin aman. Anda berhak mendapatkan pengalihan jadwal kunjungan (reschedule) atau pengembalian dana resmi (refund PNBP) sesuai SOP kementerian.',
    },
  ];

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-slate-900">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          Pusat Bantuan &amp; Pertanyaan Umum
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Pertanyaan Seputar Kunjungan Bromo
        </h2>
        <p className="text-slate-400 text-sm mt-2">
          Segala hal yang perlu Anda ketahui mengenai tiket digital dan aturan kawasan.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {faqs.map((f, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-900/40 transition"
              >
                <span className="text-sm font-bold text-white tracking-tight">{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-amber-400 shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`} />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3 animate-in fade-in">
                  {f.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Emergency Hotline Contact Cards */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Call Center 24 Jam</div>
            <div className="text-xs font-bold text-white mt-0.5">(0341) 491828</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Email Pengaduan</div>
            <div className="text-xs font-bold text-white mt-0.5">layanan@tnbts.go.id</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Kantor Balai Besar</div>
            <div className="text-xs font-bold text-white mt-0.5">Jl. Raden Panji Suroso, Malang</div>
          </div>
        </div>
      </div>

    </section>
  );
}
