'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, MapPin, Car, ShieldAlert, ArrowRight, ArrowLeft, Check, Sparkles, AlertCircle } from 'lucide-react';

export default function BookingWizardModal({ isOpen, onClose, initialDestinationId, initialDate, destinations = [], onBookingSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleClose = () => {
    if (step >= 2) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    onClose();
  };

  // Form State
  const [destinationId, setDestinationId] = useState(initialDestinationId || destinations[0]?.id || '');
  const [slotId, setSlotId] = useState('');
  const [visitDate, setVisitDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const minD = d.toISOString().split('T')[0];
    return initialDate && initialDate >= minD ? initialDate : minD;
  });
  const [entranceGate, setEntranceGate] = useState('CEMORO_LAWANG');
  const [vehicleType, setVehicleType] = useState('JEEP');
  const [vehiclePlateNumber, setVehiclePlateNumber] = useState('');
  const [visitors, setVisitors] = useState([
    { fullName: '', identityType: 'KTP', identityNumber: '', citizenship: 'DOMESTIK' },
  ]);

  // Quota Data
  const [quotaData, setQuotaData] = useState(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [agreedSOP, setAgreedSOP] = useState(true);

  // Behavioral timing metric
  const [modalOpenedAt] = useState(Date.now());

  // H-2 minimum date
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  })();

  useEffect(() => {
    if (initialDestinationId) setDestinationId(initialDestinationId);
    if (initialDate) setVisitDate(initialDate);
  }, [initialDestinationId, initialDate]);

  const selectedDest = destinations.find(d => d.id === destinationId) || destinations[0];

  // Set default slot if not set
  useEffect(() => {
    if (selectedDest?.slots?.length > 0 && !slotId) {
      setSlotId(selectedDest.slots[0].id);
    }
  }, [selectedDest, slotId]);

  // Fetch live quota when destination/date changes
  useEffect(() => {
    if (!destinationId || !visitDate) return;
    async function fetchQuota() {
      setQuotaLoading(true);
      try {
        const res = await fetch(`/api/quotas?destinationId=${destinationId}&date=${visitDate}`);
        const data = await res.json();
        if (data.success && data.quotas?.length > 0) {
          const matchingSlotQuota = data.quotas.find(q => q.slot_id === slotId) || data.quotas[0];
          setQuotaData(matchingSlotQuota);
        } else {
          setQuotaData(null);
        }
      } catch (err) {
        console.error('Failed to fetch quota:', err);
      } finally {
        setQuotaLoading(false);
      }
    }
    fetchQuota();
  }, [destinationId, slotId, visitDate]);

  if (!isOpen) return null;

  const handleAddVisitor = () => {
    if (visitors.length >= 8) {
      setErrorMessage('Maksimal pemesanan dalam 1 transaksi adalah 8 orang.');
      return;
    }
    setVisitors([...visitors, { fullName: '', identityType: 'KTP', identityNumber: '', citizenship: 'DOMESTIK' }]);
    setErrorMessage('');
  };

  const handleRemoveVisitor = (index) => {
    if (visitors.length === 1) return;
    setVisitors(visitors.filter((_, i) => i !== index));
  };

  const handleVisitorChange = (index, field, value) => {
    const updated = [...visitors];
    updated[index][field] = value;
    setVisitors(updated);
  };

  // Submit Booking Reservation
  const handleConfirmReservation = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const fillDurationMs = Date.now() - modalOpenedAt;

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationId,
          slotId,
          visitDate,
          entranceGate,
          vehicleType,
          vehiclePlateNumber,
          visitors,
          formFillDurationMs: fillDurationMs,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal membuat reservasi.');
      }

      onBookingSuccess(data.data);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Estimation
  const isWeekend = (new Date(visitDate).getDay() === 0 || new Date(visitDate).getDay() === 6);
  let estTickets = 0;
  let estInsurance = 0;
  visitors.forEach(v => {
    const price = v.citizenship === 'DOMESTIK'
      ? (isWeekend ? Number(selectedDest?.ticket_price_domestic_weekend) : Number(selectedDest?.ticket_price_domestic_weekday))
      : (isWeekend ? Number(selectedDest?.ticket_price_foreign_weekend) : Number(selectedDest?.ticket_price_foreign_weekday));
    estTickets += price || 0;
    estInsurance += Number(selectedDest?.insurance_fee) || 5000;
  });
  const vehicleFeeMap = { JEEP: 10000, MOBIL: 15000, MOTOR: 5000, SEPEDA: 2000, JALAN_KAKI: 0 };
  const estVehicle = vehicleFeeMap[vehicleType] || 0;
  const grandTotal = estTickets + estInsurance + estVehicle;

  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      {/* Exit confirmation dialog */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-slate-700 shadow-2xl text-center space-y-4">
            <div className="text-base font-bold text-white">Batalkan Pemesanan?</div>
            <p className="text-xs text-slate-400">Data yang sudah Anda isi akan hilang. Yakin ingin membatalkan?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition">
                Tetap di Sini
              </button>
              <button onClick={handleConfirmExit} className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition">
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Reservasi Resmi TNBTS</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Step {step} of 3</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {step === 1 && 'Pilih Destinasi & Kuota'}
              {step === 2 && 'Data Pengunjung & Identitas'}
              {step === 3 && 'Konfirmasi & Kunci Reservasi'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          
          {/* STEP 1: DESTINATION & QUOTA */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Pilih Site Destinasi
                </label>
                <select
                  value={destinationId}
                  onChange={(e) => {
                    setDestinationId(e.target.value);
                    const dest = destinations.find(d => d.id === e.target.value);
                    if (dest?.slots?.length > 0) setSlotId(dest.slots[0].id);
                  }}
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Tanggal Kunjungan
                  </label>
                  <input
                    type="date"
                    min={minDate}
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Slot Waktu
                  </label>
                  <select
                    value={slotId}
                    onChange={(e) => setSlotId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
                  >
                    {selectedDest?.slots?.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.slot_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-time Quota Availability Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Status Kuota Kunjungan:</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {visitDate} • {selectedDest?.name}
                  </div>
                </div>
                <div className="text-right">
                  {quotaLoading ? (
                    <span className="text-xs text-slate-400 animate-pulse">Memeriksa kuota...</span>
                  ) : quotaData ? (
                    <div>
                      <div className="text-xl font-black text-emerald-400 font-mono">
                        {quotaData.available_quota} <span className="text-xs font-normal text-slate-400">sisa kuota</span>
                      </div>
                      <div className="text-[11px] text-slate-400">dari total {quotaData.total_quota}</div>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-400">Kuota belum dirilis</span>
                  )}
                </div>
              </div>

              {/* Pintu Masuk & Kendaraan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Pintu Gerbang Masuk
                  </label>
                  <select
                    value={entranceGate}
                    onChange={(e) => setEntranceGate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="CEMORO_LAWANG">Cemoro Lawang (Probolinggo)</option>
                    <option value="WONOKITRI">Wonokitri (Pasuruan)</option>
                    <option value="COBAN_TRISULA">Coban Trisula (Malang)</option>
                    <option value="SENDURO">Senduro (Lumajang)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Jenis Kendaraan
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="JEEP">Jeep Wisata (Tarif Rp 10.000)</option>
                    <option value="MOBIL">Mobil Pribadi (Tarif Rp 15.000)</option>
                    <option value="MOTOR">Sepeda Motor (Tarif Rp 5.000)</option>
                    <option value="SEPEDA">Sepeda Gowes (Tarif Rp 2.000)</option>
                    <option value="JALAN_KAKI">Jalan Kaki / Trekking (Rp 0)</option>
                  </select>
                </div>
              </div>

              {vehicleType !== 'JALAN_KAKI' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Nomor Polisi / Plat Kendaraan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: N 1234 BZ"
                    value={vehiclePlateNumber}
                    onChange={(e) => setVehiclePlateNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-semibold text-white uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* Official TNBTS SOP Agreement Box (Persis seperti syarat resmi booking Bromo) */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>SOP &amp; Persyaratan Kunjungan Kawasan Konservasi TNBTS</span>
                </div>
                <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc pl-4">
                  <li>Wajib membawa kartu identitas asli (KTP/Paspor) yang masih berlaku sesuai data booking.</li>
                  <li>Dilarang keras membawa flare, petasan, kembang api, atau menyalakan api unggun.</li>
                  <li>Dilarang melintasi batas aman radius 1 km dari bibir kawah aktif Gunung Bromo.</li>
                  <li>Tiket yang dibeli terikat NIK asli dan dilarang diperjualbelikan melalui pihak ketiga/calo.</li>
                </ul>
                <label className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs text-white font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedSOP}
                    onChange={(e) => setAgreedSOP(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span>Saya telah membaca dan menyetujui seluruh SOP kunjungan resmi TNBTS.</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: VISITORS DATA */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Daftar Rombongan Pengunjung</h4>
                  <p className="text-[11px] text-slate-400">1 NIK hanya boleh terdaftar pada 1 tiket per minggu.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVisitor}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition"
                >
                  + Tambah Pengunjung
                </button>
              </div>

              <div className="space-y-3">
                {visitors.map((v, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 relative space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                      <span>Pengunjung #{idx + 1} {idx === 0 && '(Ketua Rombongan)'}</span>
                      {visitors.length > 1 && (
                        <button
                          onClick={() => handleRemoveVisitor(idx)}
                          className="text-slate-500 hover:text-rose-400 transition text-[11px]"
                        >
                          Hapus
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nama Lengkap (Sesuai KTP)</label>
                        <input
                          type="text"
                          required
                          placeholder="Nama lengkap..."
                          value={v.fullName}
                          onChange={(e) => handleVisitorChange(idx, 'fullName', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nomor NIK / Paspor</label>
                        <input
                          type="text"
                          required
                          placeholder="16 digit NIK atau Nomor Paspor..."
                          value={v.identityNumber}
                          onChange={(e) => handleVisitorChange(idx, 'identityNumber', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Jenis Identitas</label>
                        <select
                          value={v.identityType}
                          onChange={(e) => handleVisitorChange(idx, 'identityType', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                        >
                          <option value="KTP">KTP (WNI)</option>
                          <option value="PASPOR">Paspor (WNA/WNI)</option>
                          <option value="SIM">SIM</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Kewarganegaraan</label>
                        <select
                          value={v.citizenship}
                          onChange={(e) => handleVisitorChange(idx, 'citizenship', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                        >
                          <option value="DOMESTIK">WNI (Domestik)</option>
                          <option value="MANCANEGARA">WNA (Mancanegara)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & LOCK RESERVATION */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  Setelah tombol konfirmasi ditekan, kuota tiket rombongan Anda akan <strong>dikunci selama 15 menit</strong>. Tidak ada orang lain yang dapat mengambil kuota Anda selama masa pembayaran.
                </span>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Destinasi:</span>
                  <span className="font-bold text-white">{selectedDest?.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Tanggal Kunjungan:</span>
                  <span className="font-bold text-white">{visitDate} ({isWeekend ? 'Weekend' : 'Weekday'})</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Pintu Gerbang:</span>
                  <span className="font-bold text-white">{entranceGate}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Total Pengunjung:</span>
                  <span className="font-bold text-white">{visitors.length} Orang</span>
                </div>

                {/* Price Breakdown */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Tiket Masuk ({visitors.length} orang):</span>
                    <span className="font-mono text-slate-200">{formatIDR(estTickets)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Asuransi Jiwa ({visitors.length} orang):</span>
                    <span className="font-mono text-slate-200">{formatIDR(estInsurance)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Retribusi Kendaraan ({vehicleType}):</span>
                    <span className="font-mono text-slate-200">{formatIDR(estVehicle)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-amber-400 pt-2 border-t border-slate-800">
                    <span>Total Pembayaran PNBP:</span>
                    <span className="font-mono">{formatIDR(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !agreedSOP) {
                  setErrorMessage('Anda wajib menyetujui SOP Kunjungan resmi TNBTS untuk melanjutkan pemesanan.');
                  return;
                }
                if (step === 2) {
                  // Validate visitor data
                  for (let i = 0; i < visitors.length; i++) {
                    if (!visitors[i].fullName || !visitors[i].identityNumber) {
                      setErrorMessage(`Data nama dan NIK pada pengunjung #${i + 1} wajib diisi lengkap.`);
                      return;
                    }
                  }
                }
                setErrorMessage('');
                setStep(step + 1);
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
            >
              <span>Lanjut</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmReservation}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-emerald-500/20"
            >
              <span>{loading ? 'Mengunci Kuota...' : 'Kunci Kuota & Bayar'}</span>
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
