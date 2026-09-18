'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QrCode, ArrowLeft, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Compass, Users } from 'lucide-react';

export default function GateScannerPage() {
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [gateLocation, setGateLocation] = useState('CEMORO_LAWANG');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  // Web Audio tactile beep feedback
  const playScanBeep = (isValid) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (isValid) {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {}
  };

  const handleScanSubmit = async (e) => {
    e?.preventDefault();
    if (!ticketCodeInput.trim()) return;

    setLoading(true);
    setScanResult(null);

    try {
      const res = await fetch('/api/gate/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketCode: ticketCodeInput.trim(),
          token: tokenInput.trim() || undefined,
          gateLocation,
        }),
      });

      const data = await res.json();
      const resultObj = data.data || { isValid: false, message: data.message };
      setScanResult(resultObj);
      playScanBeep(resultObj.isValid);

      if (data.data) {
        setRecentScans((prev) => [
          {
            code: ticketCodeInput.trim(),
            time: new Date().toLocaleTimeString('id-ID'),
            valid: data.data.isValid,
            visitor: data.data.ticket?.visitorName || 'Pengunjung',
          },
          ...prev.slice(0, 7),
        ]);
      }
    } catch (err) {
      setScanResult({ isValid: false, message: 'Gagal menghubungi server verifikasi.' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillFromPreset = (code, token) => {
    setTicketCodeInput(code);
    if (token) setTokenInput(token);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col p-4 sm:p-6 font-sans">
      {/* Top Bar */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Portal</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs font-bold text-emerald-400">Scanner Aktif (Online)</span>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-between space-y-6">
        
        {/* Officer Gate Info Box */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Pos Pemeriksaan Gerbang</div>
              <select
                value={gateLocation}
                onChange={(e) => setGateLocation(e.target.value)}
                className="bg-transparent text-sm font-extrabold text-white focus:outline-none cursor-pointer"
              >
                <option value="CEMORO_LAWANG" className="bg-slate-900">Cemoro Lawang (Probolinggo)</option>
                <option value="WONOKITRI" className="bg-slate-900">Wonokitri (Pasuruan)</option>
                <option value="COBAN_TRISULA" className="bg-slate-900">Coban Trisula (Malang)</option>
                <option value="SENDURO" className="bg-slate-900">Senduro (Lumajang)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Big Scanner Result Display Banner */}
        {scanResult && (
          <div className={`p-6 rounded-3xl border-2 text-center animate-in zoom-in-95 shadow-2xl ${
            scanResult.isValid
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500 text-rose-300'
          }`}>
            <div className="flex justify-center mb-3">
              {scanResult.isValid ? (
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/50">
                  <XCircle className="w-10 h-10 stroke-[2.5]" />
                </div>
              )}
            </div>

            <h2 className="text-2xl font-black uppercase tracking-tight">
              {scanResult.isValid ? 'TIKET VALID (HIJAU)' : 'TIKET INVALID (MERAH)'}
            </h2>
            <p className="text-xs font-semibold mt-1 opacity-90">{scanResult.message}</p>

            {/* Minimum Necessary Verification Data */}
            {scanResult.isValid && scanResult.ticket && (
              <div className="mt-4 pt-4 border-t border-emerald-500/30 text-left text-xs space-y-1.5 bg-slate-950/60 p-3 rounded-2xl">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Pengunjung:</span>
                  <span className="font-extrabold text-white uppercase">{scanResult.ticket.visitorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">NIK Terdaftar:</span>
                  <span className="font-mono font-bold text-amber-300">{scanResult.ticket.identityNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Destinasi / Tanggal:</span>
                  <span className="text-white font-medium">{scanResult.ticket.destinationName} ({scanResult.ticket.visitDate})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Gerbang:</span>
                  <span className="text-emerald-400 font-bold">TERVERIFIKASI &amp; CHECK-IN SELESAI</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual QR / Token Input Form */}
        <form onSubmit={handleScanSubmit} className="glass-card p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <QrCode className="w-4 h-4" />
            <span>Verifikasi Kode Tiket &amp; Token Dinamis</span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Kode Tiket (TKT-XXXX)</label>
            <input
              type="text"
              required
              placeholder="Contoh: TKT-20260919-XXXX"
              value={ticketCodeInput}
              onChange={(e) => setTicketCodeInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-mono font-bold text-white uppercase focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Token Dinamis 45s (Dari QR Code)
            </label>
            <input
              type="text"
              placeholder="Contoh: fa7b221c196c8b8b.39772046"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-400"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Kosongkan jika melakukan verifikasi manual darurat (*offline override*).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            <span>{loading ? 'Memvalidasi...' : 'Verifikasi Tiket Masuk'}</span>
          </button>
        </form>

        {/* Recent Scan History */}
        {recentScans.length > 0 && (
          <div className="glass-panel p-4 rounded-2xl border border-slate-800">
            <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">
              Riwayat Pemindaian Terakhir (Pos Ini)
            </div>
            <div className="space-y-1.5">
              {recentScans.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={s.valid ? 'text-emerald-400' : 'text-rose-400'}>
                      {s.valid ? '✓' : '✕'}
                    </span>
                    <span className="font-mono font-bold text-white">{s.code}</span>
                    <span className="text-slate-400 text-[11px]">({s.visitor})</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
