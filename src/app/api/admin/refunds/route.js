import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { logAudit } from '@/lib/auditLogger.js';
import db from '@/lib/db.js';

const ALLOWED_ROLES = ['ADMIN_TNBTS', 'OPERATOR_KEUANGAN', 'SUPER_ADMIN'];

// GET /api/admin/refunds — semua refund
export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Autentikasi diperlukan.' }, { status: 401 });
    if (!ALLOWED_ROLES.includes(user.primary_role)) return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || null;

    let query = `
      SELECT r.*, b.booking_code, b.visit_date, b.total_amount as booking_amount,
             d.name as destination_name,
             u.name as requester_name, u.email as requester_email
      FROM refunds r
      JOIN bookings b ON r.booking_id = b.id
      JOIN destinations d ON b.destination_id = d.id
      JOIN users u ON r.requested_by_id = u.id
    `;
    const params = [];
    if (status) { query += ' WHERE r.status = ?'; params.push(status); }
    query += ' ORDER BY r.created_at DESC';

    const refunds = db.prepare(query).all(...params);
    return NextResponse.json({ success: true, refunds });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal memuat data refund.' }, { status: 500 });
  }
}
