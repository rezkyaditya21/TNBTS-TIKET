import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { logAudit } from '@/lib/auditLogger.js';
import db from '@/lib/db.js';

const ALLOWED_ROLES = ['ADMIN_TNBTS', 'OPERATOR_KEUANGAN', 'SUPER_ADMIN'];

export async function POST(request, { params }) {
  try {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Autentikasi diperlukan.' }, { status: 401 });
    if (!ALLOWED_ROLES.includes(user.primary_role)) return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 });

    const { id } = await params;
    const { action, reviewNotes } = await request.json(); // action: 'APPROVE' | 'REJECT'

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ success: false, message: 'Action tidak valid.' }, { status: 400 });
    }
    if (action === 'REJECT' && !reviewNotes?.trim()) {
      return NextResponse.json({ success: false, message: 'Alasan penolakan wajib diisi.' }, { status: 400 });
    }

    const refund = db.prepare('SELECT * FROM refunds WHERE id = ?').get(id);
    if (!refund) return NextResponse.json({ success: false, message: 'Data refund tidak ditemukan.' }, { status: 404 });
    if (refund.status !== 'REQUESTED') {
      return NextResponse.json({ success: false, message: `Refund sudah diproses dengan status ${refund.status}.` }, { status: 400 });
    }

    const reviewTx = db.transaction(() => {
      if (action === 'APPROVE') {
        // Update refund status
        db.prepare(`
          UPDATE refunds SET status = 'APPROVED', reviewed_by_id = ?, reviewed_at = datetime('now'), review_notes = ? WHERE id = ?
        `).run(user.id, reviewNotes?.trim() || null, id);

        // Update booking status
        db.prepare(`UPDATE bookings SET status = 'REFUNDED' WHERE id = ?`).run(refund.booking_id);

        // Return quota back
        const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(refund.booking_id);
        if (booking) {
          db.prepare(`
            UPDATE quotas
            SET paid_quota = MAX(0, paid_quota - ?), version = version + 1
            WHERE destination_id = ? AND visit_date = ?
          `).run(booking.total_visitors, booking.destination_id, booking.visit_date);
        }
      } else {
        db.prepare(`
          UPDATE refunds SET status = 'REJECTED', reviewed_by_id = ?, reviewed_at = datetime('now'), review_notes = ? WHERE id = ?
        `).run(user.id, reviewNotes.trim(), id);
      }
    });

    reviewTx();

    logAudit({
      userId: user.id,
      action: action === 'APPROVE' ? 'REFUND_APPROVED' : 'REFUND_REJECTED',
      entityType: 'Refund',
      entityId: id,
      newValues: { action, reviewNotes },
    });

    return NextResponse.json({
      success: true,
      message: action === 'APPROVE' ? 'Refund disetujui. Booking diubah ke REFUNDED.' : 'Refund ditolak.',
    });
  } catch (err) {
    console.error('Refund review error:', err);
    return NextResponse.json({ success: false, message: 'Gagal memproses review refund.' }, { status: 500 });
  }
}
