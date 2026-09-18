'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Save, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    identityType: 'KTP',
    nikOrPassport: '',
    citizenship: 'DOMESTIK',
    gender: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.success && data.profile) {
          setForm({
            fullName: data.profile.full_name || '',
            identityType: data.profile.identity_type || 'KTP',
            nikOrPassport: data.profile.nik_or_passport || '',
            citizenship: data.profile.citizenship || 'DOMESTIK',
            gender: data.profile.gender || '',
            emergencyContactName: data.profile.emergency_contact_name || '',
            emergencyContactPhone: data.profile.emergency_contact_phone || '',
          });
        }
      } catch {}
      finally { setLoading(false); }
    }
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal menyimpan profil.');
      setSuccess('Profil berhasil disimpan!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { label: 'Nama Lengkap', key: 'fullName', type: 'text', placeholder: 'Sesuai KTP/Paspor' },
    { label: 'Nama Kontak Darurat', key: 'emergencyContactName', type: 'text', placeholder: 'Keluarga atau teman dekat' },
    { label: 'Telepon Kontak Darurat', key: 'emergencyContactPhone', type: 'text', placeholder: 'Nomor HP yang bisa dihubungi' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 font-sans">
      <div className="max-w-xl mx-auto">
        <div className="mb-8 flex items-center justify-between pb-4 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" /><span>Kembali</span>
          </Link>
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" /><span>Profil Saya</span>
          </h1>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 animate-pulse">Memuat profil...</div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
            <div>
              <h2 className="text-base font-bold text-white">Data Identitas Pengunjung</h2>
              <p className="text-xs text-slate-400 mt-0.5">Data ini digunakan untuk mempercepat proses booking tiket.</p>
            </div>

            {success && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{success}</span>
              </div>
            )}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
              </div>
            )}

            {fields.map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400 transition"
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Jenis Identitas</label>
                <select
                  value={form.identityType}
                  onChange={(e) => setForm(f => ({ ...f, identityType: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="KTP">KTP</option>
                  <option value="PASPOR">Paspor</option>
                  <option value="SIM">SIM</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Kewarganegaraan</label>
                <select
                  value={form.citizenship}
                  onChange={(e) => setForm(f => ({ ...f, citizenship: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="DOMESTIK">WNI (Domestik)</option>
                  <option value="MANCANEGARA">WNA (Mancanegara)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                Nomor {form.identityType === 'KTP' ? 'NIK (16 digit)' : form.identityType === 'PASPOR' ? 'Paspor' : 'SIM'}
              </label>
              <input
                type="text"
                placeholder={form.identityType === 'KTP' ? '16 digit NIK' : 'Nomor identitas'}
                value={form.nikOrPassport}
                onChange={(e) => setForm(f => ({ ...f, nikOrPassport: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Jenis Kelamin</label>
              <select
                value={form.gender}
                onChange={(e) => setForm(f => ({ ...f, gender: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="">Pilih (opsional)</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Menyimpan...' : 'Simpan Profil'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
