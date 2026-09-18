import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { generateRollingToken } from '@/lib/ticketEngine.js';
import QRCode from 'qrcode';
import db from '@/lib/db.js';

export async function GET(request, { params }) {
  try {
    const { code } = await params;

    const ticket = db.prepare(`
      SELECT t.*, d.name as destination_name, d.location_zone, s.slot_name,
             b.booking_code, b.entrance_gate as booking_gate, b.user_id
      FROM tickets t
      JOIN destinations d ON t.destination_id = d.id
      LEFT JOIN visit_slots s ON t.slot_id = s.id
      JOIN bookings b ON t.booking_id = b.id
      WHERE t.ticket_code = ?
    `).get(code);

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Tiket tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Generate Dynamic Rolling Token
    const rollingToken = generateRollingToken(ticket.id, ticket.secret_token_salt);

    // Payload embedded into QR Code: JSON string containing ticketCode and dynamic token
    const qrPayload = JSON.stringify({
      code: ticket.ticket_code,
      token: rollingToken.token,
      v: ticket.visitor_name,
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticketCode: ticket.ticket_code,
        bookingCode: ticket.booking_code,
        visitorName: ticket.visitor_name,
        identityNumber: ticket.identity_number,
        destinationName: ticket.destination_name,
        locationZone: ticket.location_zone,
        slotName: ticket.slot_name,
        visitDate: ticket.visit_date,
        entranceGate: ticket.entrance_gate,
        status: ticket.status,
        issuedAt: ticket.issued_at,
        usedAt: ticket.used_at,
      },
      dynamicSecurity: {
        token: rollingToken.token,
        secondsRemaining: rollingToken.secondsRemaining,
        qrDataUrl,
      },
    });
  } catch (err) {
    console.error('Fetch ticket error:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat tiket digital.' },
      { status: 500 }
    );
  }
}
