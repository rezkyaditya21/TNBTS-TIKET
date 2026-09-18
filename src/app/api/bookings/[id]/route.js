import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import db from '@/lib/db.js';

const PRIVILEGED_ROLES = ['ADMIN_TNBTS', 'OPERATOR_KEUANGAN', 'SUPER_ADMIN'];

export async function GET(request, { params }) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Autentikasi diperlukan.' }, { status: 401 });
    }

    const { id } = await params;

    const booking = db.prepare(`
      SELECT b.*, d.name as destination_name, d.location_zone, s.slot_name,
             p.status as payment_status, p.payment_method, p.payment_code, p.qr_string, p.amount as payment_amount,
             r.expires_at as reservation_expires_at, r.status as reservation_status
      FROM bookings b
      JOIN destinations d ON b.destination_id = d.id
      LEFT JOIN visit_slots s ON b.slot_id = s.id
      LEFT JOIN payments p ON b.id = p.booking_id
      LEFT JOIN reservations r ON b.id = r.booking_id
      WHERE (b.id = ? OR b.booking_code = ?)
    `).get(id, id);

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    // Ownership check — admins bypass
    if (!PRIVILEGED_ROLES.includes(user.primary_role) && booking.user_id !== user.id) {
      return NextResponse.json({ success: false, message: 'Akses ditolak. Booking ini bukan milik Anda.' }, { status: 403 });
    }

    const visitors = db.prepare('SELECT * FROM booking_visitors WHERE booking_id = ?').all(booking.id);
    const tickets = db.prepare('SELECT * FROM tickets WHERE booking_id = ?').all(booking.id);

    return NextResponse.json({ success: true, booking: { ...booking, visitors, tickets } });
  } catch (err) {
    console.error('Fetch booking details error:', err);
    return NextResponse.json({ success: false, message: 'Gagal memuat rincian booking.' }, { status: 500 });
  }
}
