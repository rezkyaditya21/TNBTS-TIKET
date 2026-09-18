import { NextResponse } from 'next/server';
import { confirmPaymentAndIssueTickets } from '@/lib/bookingEngine.js';

export async function POST(request) {
  try {
    const { bookingId, paymentMethod = 'QRIS' } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: 'ID booking wajib diisi.' },
        { status: 400 }
      );
    }

    const result = confirmPaymentAndIssueTickets(bookingId, paymentMethod);

    return NextResponse.json({
      success: true,
      message: 'Pembayaran berhasil disimulasikan lunas! Tiket digital resmi telah diterbitkan.',
      data: result,
    });
  } catch (err) {
    console.error('Payment confirmation error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal memproses pembayaran.' },
      { status: 400 }
    );
  }
}
