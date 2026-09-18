import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { logAudit } from '@/lib/auditLogger.js';
import db from '@/lib/db.js';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user || !['ADMIN_TNBTS', 'SUPER_ADMIN'].includes(user.primary_role)) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak.' },
        { status: 403 }
      );
    }

    const events = db.prepare(`
      SELECT re.*, rs.score, rs.risk_level, u.name as user_name, u.email as user_email
      FROM risk_events re
      LEFT JOIN risk_scores rs ON re.risk_score_id = rs.id
      LEFT JOIN users u ON re.user_id = u.id
      ORDER BY re.created_at DESC
      LIMIT 50
    `).all();

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Gagal memuat log keamanan.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = getCurrentUser(request);
    if (!user || !['ADMIN_TNBTS', 'SUPER_ADMIN'].includes(user.primary_role)) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak.' },
        { status: 403 }
      );
    }

    const { eventId, status, reviewNotes } = await request.json();

    db.prepare(`
      UPDATE risk_events
      SET status = ?, review_notes = ?
      WHERE id = ?
    `).run(status, reviewNotes || null, eventId);

    logAudit({
      userId: user.id,
      action: 'RISK_EVENT_STATUS_UPDATED',
      entityType: 'RiskEvent',
      entityId: eventId,
      newValues: { status, reviewNotes },
    });

    return NextResponse.json({
      success: true,
      message: 'Status aktivitas mencurigakan berhasil diperbarui.',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui status event.' },
      { status: 500 }
    );
  }
}
