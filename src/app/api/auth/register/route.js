import { NextResponse } from 'next/server';
import db from '@/lib/db.js';
import { hashPassword, generateToken } from '@/lib/auth.js';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { name, email, phone, password, nik } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Nama, email, dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Kata sandi minimal 6 karakter.' },
        { status: 400 }
      );
    }

    // Check existing email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Email sudah terdaftar. Silakan login.' },
        { status: 400 }
      );
    }

    const userId = 'usr-' + crypto.randomUUID();
    const hashedPassword = hashPassword(password);

    db.prepare(`
      INSERT INTO users (id, name, email, phone, password, primary_role, is_active, is_verified, risk_score, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'PENGUNJUNG', 1, 0, 0, datetime('now'), datetime('now'))
    `).run(userId, name.trim(), email.trim().toLowerCase(), phone?.trim() || null, hashedPassword);

    // Create visitor profile if NIK provided
    if (nik) {
      db.prepare(`
        INSERT INTO visitor_profiles (id, user_id, full_name, nik_or_passport, citizenship, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'DOMESTIK', datetime('now'), datetime('now'))
      `).run('vp-' + crypto.randomUUID(), userId, name.trim(), nik.trim());
    }

    const newUser = { id: userId, name: name.trim(), email: email.trim().toLowerCase(), role: 'PENGUNJUNG' };
    const token = generateToken(newUser);

    const response = NextResponse.json({
      success: true,
      message: 'Registrasi akun berhasil!',
      user: newUser,
      token,
    });

    response.cookies.set('tnbts_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal melakukan pendaftaran akun.' },
      { status: 500 }
    );
  }
}
