import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { logAudit } from '@/lib/auditLogger.js';
import db from '@/lib/db.js';
import crypto from 'crypto';

// POST /api/refunds — user ajukan refund
export async function POST(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Autentikasi diperlukan.' }, { status: 401 });

    const { bookingId, reason, bankName, bankAccountNumber, bankAccountHolder } = await request.json();

    // Validasi field wajib
    if (!bookingId || !reason?.trim() || !bankName?.trim() || !bankAccountNumber?.trim() || !bankAccountHolder?.trim()) {
      return NextResponse.json({ success: false, message: 'Semua field wajib diisi.' }, { status: 400 });
    }
    if (reason.trim().length > 500) return NextResponse.json({ success: false, message: 'Alasan maksimal 500 karakter.' }, { status: 400 });
    if (!/^\d{6,20}$/.test(bankAccountNumber.trim())) {
      return NextResponse.json({ success: false, message: 'Nomor rekening harus 6-20 digit angka.' }, { status: 400 });
    }

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(bookingId, user.id);
    if (!booking) return NextResponse.json({ success: false, message: 'Booking tidak ditemukan.' }, { status: 404 });

    const today = new Date().toISOString().split('T')[0];
    if (booking.visit_date <= today) {
      return NextResponse.json({ success: false, message: 'Batas waktu pengajuan refund telah terlewat (kunjungan sudah berlangsung atau hari ini).' }, { status: 400 });
    }
    if (booking.status !== 'PAID') {
      return NextResponse.json({ success: false, message: `Refund tidak dapat diajukan untuk booking dengan status ${booking.status}.` }, { status: 400 });
    }

    // Cek refund sudah ada
    const existingRefund = db.prepare('SELECT id, status FROM refunds WHERE booking_id = ?').get(bookingId);
    if (existingRefund) {
      return NextResponse.json({ success: false, message: `Permohonan refund sudah ada dengan status ${existingRefund.status}.` }, { status: 400 });
    }

    const refundId = 'rfd-' + crypto.randomUUID();
    db.prepare(`
      INSERT INTO refunds (id, booking_id, requested_by_id, amount, reason, bank_name, bank_account_number, bank_account_holder, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'REQUESTED', datetime('now'))
    `).run(refundId, bookingId, user.id, booking.total_amount, reason.trim(), bankName.trim(), bankAccountNumber.trim(), bankAccountHolder.trim());

    logAudit({ userId: user.id, action: 'REFUND_REQUESTED', entityType: 'Refund', entityId: refundId, newValues: { bookingId, amount: booking.total_amount } });

    return NextResponse.json({ success: true, message: 'Permohonan refund berhasil diajukan. Admin akan meninjau dalam 1-3 hari kerja.' });
  } catch (err) {
    console.error('Refund request error:', err);
    return NextResponse.json({ success: false, message: 'Gagal mengajukan refund.' }, { status: 500 });
  }
}

// GET /api/refunds — list refund milik user
export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Autentikasi diperlukan.' }, { status: 401 });

    const refunds = db.prepare(`
      SELECT r.*, b.booking_code, b.visit_date, b.destination_id,
             d.name as destination_name
      FROM refunds r
      JOIN bookings b ON r.booking_id = b.id
      JOIN destinations d ON b.destination_id = d.id
      WHERE r.requested_by_id = ?
      ORDER BY r.created_at DESC
    `).all(user.id);

    return NextResponse.json({ success: true, refunds });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal memuat data refund.' }, { status: 500 });
  }
}
