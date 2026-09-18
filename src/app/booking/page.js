'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ShieldCheck, ShieldAlert, Calendar, Users, MapPin, Car, Check, AlertCircle, Compass, Sparkles } from 'lucide-react';

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryDest = searchParams.get('destination') || '';
  const queryDate = searchParams.get('date') || '';

  const [step, setStep] = useState(1);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [destinationId, setDestinationId] = useState(queryDest || 'dest-1');
  const [visitDate, setVisitDate] = useState(queryDate || new Date().toISOString().split('T')[0]);
  const [slotId, setSlotId] = useState('');
  const [entranceGate, setEntranceGate] = useState('CEMORO_LAWANG');
  const [vehicleType, setVehicleType] = useState('JEEP');
  const [vehiclePlateNumber, setVehiclePlateNumber] = useState('');
  const [agreedSOP, setAgreedSOP] = useState(false);
  const [visitors, setVisitors] = useState([
    { fullName: '', identityType: 'KTP', identityNumber: '', citizenship: 'DOMESTIK' },
  ]);

  // Quota Data
  const [quotaData, setQuotaData] = useState(null);
  const [quotaLoading, setQuotaLoading] = useState(false);

  // Load Destinations
  useEffect(() => {
    async function loadDestinations() {
      try {
        const res = await fetch('/api/destinations');
        const data = await res.json();
        if (data.success) {
          setDestinations(data.destinations || []);
          if (!queryDest && data.destinations.length > 0) {
            setDestinationId(data.destinations[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load destinations:', err);
      }
    }
    loadDestinations();
  }, [queryDest]);

  const selectedDest = destinations.find(d => d.id === destinationId) || destinations[0];

  // Sync default slot
  useEffect(() => {
    if (selectedDest?.slots?.length > 0) {
      setSlotId(selectedDest.slots[0].id);
    }
  }, [selectedDest]);

  // Fetch live quota
  useEffect(() => {
    if (!destinationId || !visitDate) return;
    async function fetchQuota() {
      setQuotaLoading(true);
      try {
        const res = await fetch(`/api/quotas?destinationId=${destinationId}&date=${visitDate}`);
        const data = await res.json();
        if (data.success && data.quotas?.length > 0) {
          const matching = data.quotas.find(q => q.slot_id === slotId) || data.quotas[0];
          setQuotaData(matching);
        } else {
          setQuotaData(null);
        }
      } catch (err) {
        console.error('Failed to load quota:', err);
      } finally {
        setQuotaLoading(false);
      }
    }
    fetchQuota();
  }, [destinationId, visitDate, slotId]);

  const handleAddVisitor = () => {
    if (visitors.length >= 8) {
      setErrorMessage('Maksimal 8 orang per transaksi rombongan.');
      return;
    }
    setVisitors([
      ...visitors,
      { fullName: '', identityType: 'KTP', identityNumber: '', citizenship: 'DOMESTIK' },
    ]);
  };

  const handleRemoveVisitor = (index) => {
    if (visitors.length <= 1) return;
    setVisitors(visitors.filter((_, i) => i !== index));
  };

  const handleVisitorChange = (index, field, value) => {
    const updated = [...visitors];
    updated[index][field] = value;
    setVisitors(updated);
  };

  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // Price calculation
  const isWeekend = (new Date(visitDate).getDay() === 0 || new Date(visitDate).getDay() === 6);
  let estTickets = 0;
  let estInsurance = 0;
  const insurancePerPerson = Number(selectedDest?.insurance_fee) || 5000;

  visitors.forEach(v => {
    const price = v.citizenship === 'DOMESTIK'
      ? (isWeekend ? Number(selectedDest?.ticket_price_domestic_weekend || 34000) : Number(selectedDest?.ticket_price_domestic_weekday || 29000))
      : (isWeekend ? Number(selectedDest?.ticket_price_foreign_weekend || 340000) : Number(selectedDest?.ticket_price_foreign_weekday || 220000));
    estTickets += price;
    estInsurance += insurancePerPerson;
  });

  const vehicleFeeMap = { JEEP: 10000, MOBIL: 15000, MOTOR: 5000, SEPEDA: 2000, JALAN_KAKI: 0 };
  const estVehicle = vehicleFeeMap[vehicleType] || 0;
  const grandTotal = estTickets + estInsurance + estVehicle;

  const handleSubmitBooking = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationId,
          slotId,
          visitDate,
          entranceGate,
          vehicleType,
          vehiclePlateNumber: vehiclePlateNumber.trim() || undefined,
          visitors: visitors.map(v => ({
            fullName: v.fullName.trim(),
            identityType: v.identityType,
            identityNumber: v.identityNumber.trim(),
            citizenship: v.citizenship,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal membuat reservasi.');
      }

      // Smoothly navigate to dedicated full-page payment invoice!
      router.push(`/payment/${data.data.bookingCode}`);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Pemesanan Tiket TNBTS</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full p-4 sm:p-8 flex-1 space-y-6">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono ${
              step >= 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>1</span>
            <span className={step === 1 ? 'text-white' : 'text-slate-500'}>SOP &amp; Jadwal</span>
          </div>
          <div className="h-px w-8 sm:w-16 bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono ${
              step >= 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>2</span>
            <span className={step === 2 ? 'text-white' : 'text-slate-500'}>Identitas Rombongan</span>
          </div>
          <div className="h-px w-8 sm:w-16 bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono ${
              step >= 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>3</span>
            <span className={step === 3 ? 'text-white' : 'text-slate-500'}>Konfirmasi &amp; Bayar</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Perhatian:</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        {/* STEP 1: SOP & JADWAL */}
        {step === 1 && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl font-black text-white">Langkah 1: Persetujuan SOP &amp; Rencana Kunjungan</h2>
              <p className="text-xs text-slate-400 mt-1">Pilih spot matahari terbit dan patuhi aturan konservasi demi keselamatan bersama.</p>
            </div>

            {/* Official SOP Agreement Box */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <ShieldAlert className="w-4 h-4" />
                <span>Standar Operasional Prosedur (SOP) Kawasan Konservasi Bromo</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
                <li>Wajib membawa kartu identitas fisik asli (KTP/Paspor) yang masih berlaku untuk diverifikasi di pintu pos gerbang.</li>
                <li>Dilarang keras membawa flare, petasan, kembang api, atau membuat api unggun di seluruh area kaldera dan savana.</li>
                <li>Batas aman aktivitas pendakian adalah radius 1 km dari bibir kawah aktif Gunung Bromo (Level II Waspada).</li>
                <li>Tiket resmi terikat NIK asli dan dilarang dipindahtangankan kepada calo atau pihak ketiga.</li>
              </ul>
              <label className="flex items-center gap-2.5 pt-3 border-t border-slate-800 text-xs text-white font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedSOP}
                  onChange={(e) => setAgreedSOP(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <span>Saya telah membaca dan menyetujui seluruh SOP Kunjungan Resmi TNBTS.</span>
              </label>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Pilih Site / Spot Destinasi</label>
                <select
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
                >
                  {destinations.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.location_zone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Tanggal Kunjungan</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Pintu Gerbang Masuk</label>
                  <select
                    value={entranceGate}
                    onChange={(e) => setEntranceGate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="CEMORO_LAWANG">Cemoro Lawang (Probolinggo)</option>
                    <option value="WONOKITRI">Wonokitri (Pasuruan)</option>
                    <option value="COBAN_TRISULA">Coban Trisula (Malang)</option>
                    <option value="SENDURO">Senduro (Lumajang)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Jenis Kendaraan</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="JEEP">Jeep Wisata (Tarif Rp 10.000)</option>
                    <option value="MOBIL">Mobil Pribadi (Tarif Rp 15.000)</option>
                    <option value="MOTOR">Sepeda Motor (Tarif Rp 5.000)</option>
                    <option value="SEPEDA">Sepeda Gowes (Tarif Rp 2.000)</option>
                    <option value="JALAN_KAKI">Jalan Kaki / Trekking (Rp 0)</option>
                  </select>
                </div>

                {vehicleType !== 'JALAN_KAKI' && (
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Plat Nomor Kendaraan (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: N 1234 BZ"
                      value={vehiclePlateNumber}
                      onChange={(e) => setVehiclePlateNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-semibold text-white uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

              {/* Live Quota Badge */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Sisa Kuota Terverifikasi:</div>
                  <div className="text-base font-extrabold text-white">
                    {quotaLoading ? 'Memeriksa kuota...' : quotaData ? `${quotaData.available_quota} orang` : 'Tersedia'}
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Real-Time Kuota
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (!agreedSOP) {
                    setErrorMessage('Anda wajib mencentang persetujuan SOP Kunjungan Resmi TNBTS untuk melanjutkan.');
                    return;
                  }
                  setErrorMessage('');
                  setStep(2);
                }}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <span>Lanjut ke Data Rombongan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DATA ROMBONGAN */}
        {step === 2 && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Langkah 2: Data Pengunjung &amp; Nomor NIK</h2>
                <p className="text-xs text-slate-400 mt-1">1 NIK KTP dibatasi 1 tiket resmi per minggu demi memutus rantai percaloan.</p>
              </div>
              <button
                type="button"
                onClick={handleAddVisitor}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold border border-amber-500/30 transition"
              >
                + Tambah Anggota
              </button>
            </div>

            <div className="space-y-4">
              {visitors.map((v, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                      Pengunjung #{idx + 1} {idx === 0 ? '(Ketua Rombongan)' : ''}
                    </span>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVisitor(idx)}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Hapus
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nama Sesuai Identitas</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama lengkap..."
                        value={v.fullName}
                        onChange={(e) => handleVisitorChange(idx, 'fullName', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nomor NIK KTP / Paspor</label>
                      <input
                        type="text"
                        required
                        placeholder="16 digit NIK..."
                        value={v.identityNumber}
                        onChange={(e) => handleVisitorChange(idx, 'identityNumber', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`citizen-${idx}`}
                        checked={v.citizenship === 'DOMESTIK'}
                        onChange={() => handleVisitorChange(idx, 'citizenship', 'DOMESTIK')}
                        className="accent-amber-500"
                      />
                      <span className="text-slate-300">WNI (Domestik)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`citizen-${idx}`}
                        checked={v.citizenship === 'MANCANEGARA'}
                        onChange={() => handleVisitorChange(idx, 'citizenship', 'MANCANEGARA')}
                        className="accent-amber-500"
                      />
                      <span className="text-slate-300">WNA (Mancanegara)</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  for (let i = 0; i < visitors.length; i++) {
                    if (!visitors[i].fullName.trim() || !visitors[i].identityNumber.trim()) {
                      setErrorMessage(`Nama dan NIK pengunjung #${i + 1} wajib diisi.`);
                      return;
                    }
                  }
                  setErrorMessage('');
                  setStep(3);
                }}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <span>Lanjut ke Ringkasan Biaya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: KONFIRMASI & KUNCI KUOTA */}
        {step === 3 && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl font-black text-white">Langkah 3: Konfirmasi Pemesanan &amp; Kunci Kuota</h2>
              <p className="text-xs text-slate-400 mt-1">Setelah dikonfirmasi, kuota Anda akan dikunci selama 15 menit untuk pembayaran resmi.</p>
            </div>

            {/* Summary Card */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-3">
                <span className="text-slate-400">Destinasi / Spot:</span>
                <span className="font-extrabold text-white uppercase">{selectedDest?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-3">
                <span className="text-slate-400">Tanggal Kunjungan:</span>
                <span className="font-bold text-white">{visitDate} ({isWeekend ? 'Akhir Pekan' : 'Hari Kerja'})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-3">
                <span className="text-slate-400">Pintu Masuk:</span>
                <span className="font-bold text-emerald-400">{entranceGate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-3">
                <span className="text-slate-400">Rombongan:</span>
                <span className="font-bold text-white">{visitors.length} Orang ({visitors.map(v => v.fullName).join(', ')})</span>
              </div>

              {/* Price Breakdown */}
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Tiket Masuk ({visitors.length} orang):</span>
                  <span className="font-mono text-white">{formatIDR(estTickets)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Asuransi Jiwa ({visitors.length} orang):</span>
                  <span className="font-mono text-white">{formatIDR(estInsurance)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Retribusi Kendaraan ({vehicleType}):</span>
                  <span className="font-mono text-white">{formatIDR(estVehicle)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-amber-400 pt-3 border-t border-slate-800">
                  <span>Total Tagihan PNBP:</span>
                  <span className="font-mono">{formatIDR(grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleSubmitBooking}
                className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 text-slate-950 font-black text-sm transition shadow-xl shadow-emerald-500/25 flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>{loading ? 'Mengunci Kuota...' : 'Kunci Kuota & Lanjut ke Pembayaran'}</span>
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xs">Memuat formulir pemesanan...</div>}>
      <BookingContent />
    </Suspense>
  );
}
