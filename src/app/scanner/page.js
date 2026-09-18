'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  QrCode, ArrowLeft, ShieldCheck, CheckCircle2, XCircle,
  RefreshCw, Compass, Camera, CameraOff, AlertTriangle,
} from 'lucide-react';

export default function GateScannerPage() {
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [gateLocation, setGateLocation] = useState('CEMORO_LAWANG');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const pausedRef = useRef(false);

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
        osc.start(); osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(); osc.stop(ctx.currentTime + 0.4);
      }
    } catch {}
  };

  const handleScanSubmit = useCallback(async (code, token) => {
    const ticketCode = code || ticketCodeInput.trim();
    if (!ticketCode) return;
    setLoading(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/gate/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode, token: token || tokenInput.trim() || undefined, gateLocation }),
      });
      const data = await res.json();
      const resultObj = data.data || { isValid: false, message: data.message };
      setScanResult(resultObj);
      playScanBeep(resultObj.isValid);
      if (data.data) {
        setRecentScans(prev => [{
          code: ticketCode,
          time: new Date().toLocaleTimeString('id-ID'),
          valid: data.data.isValid,
          visitor: data.data.ticket?.visitorName || 'Pengunjung',
        }, ...prev.slice(0, 7)]);
      }
    } catch {
      setScanResult({ isValid: false, message: 'Gagal menghubungi server verifikasi.' });
    } finally {
      setLoading(false);
    }
  }, [ticketCodeInput, tokenInput, gateLocation]);

  // Camera scan loop
  const scanFrame = useCallback(async () => {
    if (pausedRef.current || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      const jsQR = (await import('jsqr')).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
      if (code) {
        // Parse ticket QR payload: JSON {code, token, v}
        try {
          const payload = JSON.parse(code.data);
          if (payload.code && payload.token) {
            pausedRef.current = true;
            setTicketCodeInput(payload.code);
            setTokenInput(payload.token);
            await handleScanSubmit(payload.code, payload.token);
            // Resume after 3s
            setTimeout(() => { pausedRef.current = false; rafRef.current = requestAnimationFrame(scanFrame); }, 3000);
            return;
          }
        } catch {
          // Not JSON — try as plain ticket code
          if (code.data.startsWith('TKT-') || code.data.startsWith('TNBTS-')) {
            pausedRef.current = true;
            setTicketCodeInput(code.data);
            await handleScanSubmit(code.data, '');
            setTimeout(() => { pausedRef.current = false; rafRef.current = requestAnimationFrame(scanFrame); }, 3000);
            return;
          }
        }
      }
    } catch {}
    rafRef.current = requestAnimationFrame(scanFrame);
  }, [handleScanSubmit]);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      pausedRef.current = false;
      setScanning(true);
      rafRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      setCameraError(err.name === 'NotAllowedError'
        ? 'Izin kamera ditolak. Izinkan akses kamera di pengaturan browser Anda.'
        : `Kamera tidak tersedia: ${err.message}`);
    }
  };

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setScanning(false);
    pausedRef.current = true;
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col p-4 sm:p-6 font-sans">
      {/* Top Bar */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /><span>Kembali ke Portal</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${cameraActive && scanning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></div>
          <span className={`text-xs font-bold ${cameraActive && scanning ? 'text-emerald-400' : 'text-slate-400'}`}>
            {cameraActive && scanning ? 'Scanner Kamera Aktif' : 'Scanner Aktif (Manual)'}
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-between space-y-5">

        {/* Gate Info */}
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

        {/* Camera Preview */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4" /> Scanner Kamera
            </span>
            <button
              onClick={cameraActive ? stopCamera : startCamera}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                cameraActive
                  ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
              }`}
            >
              {cameraActive ? <><CameraOff className="w-3.5 h-3.5" /> Matikan</> : <><Camera className="w-3.5 h-3.5" /> Aktifkan Kamera</>}
            </button>
          </div>

          {cameraError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{cameraError}</span>
            </div>
          )}

          <div className={`relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 ${cameraActive ? '' : 'hidden'}`}>
            <video ref={videoRef} className="w-full aspect-video object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {scanning && !pausedRef.current && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-40 border-2 border-amber-400/70 rounded-xl animate-pulse" />
              </div>
            )}
          </div>

          {!cameraActive && !cameraError && (
            <div className="text-xs text-slate-400 text-center py-2">
              Klik <strong className="text-amber-400">Aktifkan Kamera</strong> untuk memindai QR tiket secara otomatis.
            </div>
          )}
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className={`p-5 rounded-3xl border-2 text-center animate-in zoom-in-95 shadow-2xl ${
            scanResult.isValid
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500 text-rose-300'
          }`}>
            <div className="flex justify-center mb-3">
              {scanResult.isValid ? (
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/50">
                  <XCircle className="w-9 h-9 stroke-[2.5]" />
                </div>
              )}
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight">
              {scanResult.isValid ? 'TIKET VALID ✓' : 'TIKET INVALID ✕'}
            </h2>
            <p className="text-xs font-semibold mt-1 opacity-90">{scanResult.message}</p>
            {scanResult.isValid && scanResult.ticket && (
              <div className="mt-3 pt-3 border-t border-emerald-500/30 text-left text-xs space-y-1.5 bg-slate-950/60 p-3 rounded-2xl">
                <div className="flex justify-between"><span className="text-slate-400">Nama:</span><span className="font-extrabold text-white uppercase">{scanResult.ticket.visitorName}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">NIK:</span><span className="font-mono font-bold text-amber-300">{scanResult.ticket.identityNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Destinasi:</span><span className="text-white font-medium">{scanResult.ticket.destinationName} ({scanResult.ticket.visitDate})</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Status:</span><span className="text-emerald-400 font-bold">CHECK-IN SELESAI</span></div>
              </div>
            )}
          </div>
        )}

        {/* Manual Input Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleScanSubmit(); }} className="glass-card p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <QrCode className="w-4 h-4" /><span>Verifikasi Manual</span>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Kode Tiket</label>
            <input
              type="text"
              placeholder="TKT-20260919-XXXX"
              value={ticketCodeInput}
              onChange={(e) => setTicketCodeInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-mono font-bold text-white uppercase focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Token Dinamis 45s (Dari QR)</label>
            <input
              type="text"
              placeholder="fa7b221c196c8b8b.39772046"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-400"
            />
            <p className="text-[10px] text-slate-500 mt-1">Kosongkan untuk verifikasi darurat offline.</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 text-slate-950 font-black text-sm transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            <span>{loading ? 'Memvalidasi...' : 'Verifikasi Tiket'}</span>
          </button>
        </form>

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <div className="glass-panel p-4 rounded-2xl border border-slate-800">
            <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">Riwayat Pemindaian Terakhir</div>
            <div className="space-y-1.5">
              {recentScans.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={s.valid ? 'text-emerald-400' : 'text-rose-400'}>{s.valid ? '✓' : '✕'}</span>
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
