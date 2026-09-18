import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { createBookingReservation } from '@/lib/bookingEngine.js';
import { checkRateLimit } from '@/lib/antiAbuse.js';
import db from '@/lib/db.js';

export async function POST(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Silakan login terlebih dahulu untuk memesan tiket.' },
        { status: 401 }
      );
    }

    // Rate Limiting per User & IP
    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkRateLimit(`booking-create:${user.id}:${clientIp}`, 10, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: `Terlalu banyak percobaan pemesanan. Coba lagi dalam ${rateLimit.retryAfter} detik.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      destinationId,
      slotId,
      visitDate,
      entranceGate,
      vehicleType,
      vehiclePlateNumber,
      visitors,
      formFillDurationMs,
      sessionId,
    } = body;

    // H-2 server-side validation (WIB = UTC+7)
    if (visitDate) {
      const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      today.setHours(0, 0, 0, 0);
      const minDate = new Date(today);
      minDate.setDate(minDate.getDate() + 2);
      const visit = new Date(visitDate + 'T00:00:00');
      if (visit < minDate) {
        return NextResponse.json(
          { success: false, message: 'Pemesanan hanya dapat dilakukan minimal 2 hari sebelum tanggal kunjungan sesuai aturan operasional TNBTS.' },
          { status: 400 }
        );
      }
    }

    const reservation = createBookingReservation({
      userId: user.id,
      userEmail: user.email,
      destinationId,
      slotId,
      visitDate,
      entranceGate,
      vehicleType,
      vehiclePlateNumber,
      visitors,
      sessionId: sessionId || 'sess-' + user.id,
      ip: clientIp,
      userAgent: request.headers.get('user-agent') || 'Browser',
      formFillDurationMs: formFillDurationMs || 4000,
    });

    return NextResponse.json({
      success: true,
      message: 'Reservasi berhasil dikunci selama 15 menit! Silakan selesaikan pembayaran.',
      data: reservation,
    });
  } catch (err) {
    console.error('Booking creation error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal memproses reservasi tiket.' },
      { status: 400 }
    );
  }
}

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Silakan login.' },
        { status: 401 }
      );
    }

    const bookings = db.prepare(`
      SELECT b.*, d.name as destination_name, d.location_zone, s.slot_name,
             p.status as payment_status, p.payment_method, p.payment_code, p.qr_string,
             r.expires_at as reservation_expires_at, r.status as reservation_status
      FROM bookings b
      JOIN destinations d ON b.destination_id = d.id
      LEFT JOIN visit_slots s ON b.slot_id = s.id
      LEFT JOIN payments p ON b.id = p.booking_id
      LEFT JOIN reservations r ON b.id = r.booking_id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(user.id);

    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (err) {
    console.error('Fetch user bookings error:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat riwayat booking.' },
      { status: 500 }
    );
  }
}
