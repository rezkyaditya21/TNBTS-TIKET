import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { logAudit } from '@/lib/auditLogger.js';
import db from '@/lib/db.js';

const ROLES = ['ADMIN_TNBTS', 'SUPER_ADMIN'];

export async function PUT(request, { params }) {
  try {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Autentikasi diperlukan.' }, { status: 401 });
    if (!ROLES.includes(user.primary_role)) return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { ticketPriceDomesticWeekday, ticketPriceDomesticWeekend, ticketPriceForeignWeekday, ticketPriceForeignWeekend, insuranceFee, dailyCapacity, status, statusNotice } = body;

    // Validation
    const prices = [ticketPriceDomesticWeekday, ticketPriceDomesticWeekend, ticketPriceForeignWeekday, ticketPriceForeignWeekend, insuranceFee].filter(v => v !== undefined);
    if (prices.some(p => p < 0 || p > 999999999)) {
      return NextResponse.json({ success: false, message: 'Harga harus antara Rp 0 – Rp 999.999.999.' }, { status: 400 });
    }
    if (dailyCapacity !== undefined && (dailyCapacity < 1 || dailyCapacity > 99999)) {
      return NextResponse.json({ success: false, message: 'Kapasitas harian harus antara 1 dan 99.999.' }, { status: 400 });
    }
    if (statusNotice && statusNotice.length > 255) {
      return NextResponse.json({ success: false, message: 'Status notice maksimal 255 karakter.' }, { status: 400 });
    }
    if (status && !['OPEN', 'LIMITED', 'CLOSED'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Status tidak valid.' }, { status: 400 });
    }

    const existing = db.prepare('SELECT * FROM destinations WHERE id = ?').get(id);
    if (!existing) return NextResponse.json({ success: false, message: 'Destinasi tidak ditemukan.' }, { status: 404 });

    db.prepare(`
      UPDATE destinations SET
        ticket_price_domestic_weekday = COALESCE(?, ticket_price_domestic_weekday),
        ticket_price_domestic_weekend = COALESCE(?, ticket_price_domestic_weekend),
        ticket_price_foreign_weekday  = COALESCE(?, ticket_price_foreign_weekday),
        ticket_price_foreign_weekend  = COALESCE(?, ticket_price_foreign_weekend),
        insurance_fee    = COALESCE(?, insurance_fee),
        daily_capacity   = COALESCE(?, daily_capacity),
        status           = COALESCE(?, status),
        status_notice    = ?
      WHERE id = ?
    `).run(
      ticketPriceDomesticWeekday ?? null, ticketPriceDomesticWeekend ?? null,
      ticketPriceForeignWeekday ?? null, ticketPriceForeignWeekend ?? null,
      insuranceFee ?? null, dailyCapacity ?? null,
      status ?? null, statusNotice ?? existing.status_notice,
      id
    );

    logAudit({ userId: user.id, action: 'DESTINATION_UPDATED', entityType: 'Destination', entityId: id, oldValues: existing, newValues: body });
    return NextResponse.json({ success: true, message: 'Destinasi berhasil diperbarui.' });
  } catch (err) {
    console.error('Update destination error:', err);
    return NextResponse.json({ success: false, message: 'Gagal memperbarui destinasi.' }, { status: 500 });
  }
}
