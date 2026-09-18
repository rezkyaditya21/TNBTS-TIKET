import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import db from '@/lib/db.js';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Autentikasi diperlukan.' }, { status: 401 });

    const profile = db.prepare('SELECT * FROM visitor_profiles WHERE user_id = ?').get(user.id);
    return NextResponse.json({ success: true, profile: profile || null });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal memuat profil.' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Autentikasi diperlukan.' }, { status: 401 });

    const { fullName, identityType, nikOrPassport, citizenship, gender, emergencyContactName, emergencyContactPhone } = await request.json();

    if (!fullName?.trim() || !nikOrPassport?.trim()) {
      return NextResponse.json({ success: false, message: 'Nama lengkap dan nomor identitas wajib diisi.' }, { status: 400 });
    }

    // Validate NIK/Passport
    const idType = identityType || 'KTP';
    if (idType === 'KTP' && !/^\d{16}$/.test(nikOrPassport.trim())) {
      return NextResponse.json({ success: false, message: 'NIK harus 16 digit angka.' }, { status: 400 });
    }
    if (['PASPOR', 'SIM'].includes(idType) && !/^[a-zA-Z0-9]{6,20}$/.test(nikOrPassport.trim())) {
      return NextResponse.json({ success: false, message: 'Nomor paspor/SIM harus 6-20 karakter alfanumerik.' }, { status: 400 });
    }

    const existing = db.prepare('SELECT id FROM visitor_profiles WHERE user_id = ?').get(user.id);

    if (existing) {
      db.prepare(`
        UPDATE visitor_profiles
        SET full_name = ?, identity_type = ?, nik_or_passport = ?, citizenship = ?,
            gender = ?, emergency_contact_name = ?, emergency_contact_phone = ?,
            updated_at = datetime('now')
        WHERE user_id = ?
      `).run(
        fullName.trim(), idType, nikOrPassport.trim(),
        citizenship || 'DOMESTIK', gender || null,
        emergencyContactName?.trim() || null, emergencyContactPhone?.trim() || null,
        user.id
      );
    } else {
      db.prepare(`
        INSERT INTO visitor_profiles
          (id, user_id, full_name, identity_type, nik_or_passport, citizenship, gender, emergency_contact_name, emergency_contact_phone, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        'vp-' + crypto.randomUUID(), user.id,
        fullName.trim(), idType, nikOrPassport.trim(),
        citizenship || 'DOMESTIK', gender || null,
        emergencyContactName?.trim() || null, emergencyContactPhone?.trim() || null
      );
    }

    const updated = db.prepare('SELECT * FROM visitor_profiles WHERE user_id = ?').get(user.id);
    return NextResponse.json({ success: true, message: 'Profil berhasil disimpan.', profile: updated });
  } catch (err) {
    console.error('Update profile error:', err);
    return NextResponse.json({ success: false, message: 'Gagal menyimpan profil.' }, { status: 500 });
  }
}
