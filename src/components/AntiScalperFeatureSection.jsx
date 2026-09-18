'use client';

import React from 'react';
import { Shield, Lock, Clock, QrCode, Cpu, UserCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function AntiScalperFeatureSection() {
  const features = [
    {
      icon: <Clock className="w-6 h-6 text-amber-400" />,
      title: 'Kunci Reservasi 15 Menit',
      subtitle: 'Memutus Praktik "Ticket Hoarding"',
      desc: 'Pada web lama, calo menahan tiket hingga 5 jam dengan NIK sembarang sambil mencari pembeli. Di sistem baru, kuota hanya dikunci 15 menit. Jika tidak lunas, kuota seketika otomatis kembali ke pool publik.',
      highlight: 'Otomatis Rilis Kuota',
    },
    {
      icon: <UserCheck className="w-6 h-6 text-emerald-400" />,
      title: '1 NIK = 1 Tiket Permanen',
      subtitle: 'Anti Tukar / Gonta-Ganti Nama',
      desc: 'Setiap pengunjung wajib memasukkan NIK/Paspor valid. Data terkunci permanen setelah pembayaran. Calo tidak bisa lagi membeli borongan atas nama fiktif lalu mengganti identitas tiket menjelang keberangkatan.',
      highlight: 'Terikat Identitas Asli',
    },
    {
      icon: <QrCode className="w-6 h-6 text-cyan-400" />,
      title: 'Dynamic Rolling QR Code',
      subtitle: 'Membunuh Peredaran Screenshot PDF',
      desc: 'QR Code tiket dilengkapi token kriptografis HMAC dinamis yang berotasi otomatis setiap 45 detik. Tangkapan layar (screenshot) yang dijual di calo atau grup WhatsApp akan berstatus INVALID saat discan petugas.',
      highlight: 'Rotasi Setiap 45 Detik',
    },
    {
      icon: <Cpu className="w-6 h-6 text-indigo-400" />,
      title: 'Behavioral Risk Scorer',
      subtitle: 'Deteksi Auto-Clicker & Script Bot',
      desc: 'Sistem menganalisis kecepatan input formulir, konsistensi sesi, dan frekuensi request. Bot atau skrip otomatis berkecepatan milidetik akan langsung ditahan antrean tanpa menghukum pengguna asli yang memesan wajar.',
      highlight: 'Multi-Signal Anti-Bot',
    },
  ];

  return (
    <section id="keamanan-calo" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Shield className="w-3.5 h-3.5" />
          Pondasi Keamanan Sistem Baru
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Dirancang Menghabisi Praktik Calo & Monopoli Tiket
        </h2>
        <p className="text-slate-400 text-sm sm:text-base mt-3">
          Prinsip utama: <span className="text-emerald-400 font-semibold">"Fast for legitimate users, difficult for abusive automation."</span> Menjamin keadilan akses seluruh masyarakat Indonesia dan turis asing untuk menikmati Bromo.
        </p>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((f, idx) => (
          <div
            key={idx}
            className="glass-card p-6 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition relative overflow-hidden group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shrink-0 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white tracking-tight">{f.title}</h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {f.highlight}
                  </span>
                </div>
                <div className="text-xs font-semibold text-amber-400 mb-2">{f.subtitle}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Strip */}
      <div className="mt-12 glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2 mb-2">
              <AlertOctagon className="w-4 h-4" />
              Kelemahan Sistem Tiket Lama
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Batas pembayaran 2–5 jam dimanfaatkan calo menahan tiket tanpa modal.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Tiket PDF statis disebarkan lewat screenshot WA tanpa validasi keaslian.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Bot auto-checkout memborong habis kuota akhir pekan dalam hitungan detik.</span>
              </li>
            </ul>
          </div>

          <div className="lg:border-l lg:border-slate-800 lg:pl-8">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              Standar Sistem Baru TNBTS Digital
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Reservasi terkunci 15 menit: kuota otomatis kembali jika belum dibayar.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Dynamic Rolling QR: QR berganti tiap 45 detik, anti-screenshot 100%.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Pessimistic row-locking database: kuota tidak akan pernah minus atau oversold.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

    </section>
  );
}
