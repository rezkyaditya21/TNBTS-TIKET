import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { logAudit } from '@/lib/auditLogger.js';
import db from '@/lib/db.js';
import crypto from 'crypto';

const ROLES = ['ADMIN_TNBTS', 'SUPER_ADMIN'];

function requireAdmin(request) {
  const user = getCurrentUser(request);
  if (!user) return { error: 'Autentikasi diperlukan.', status: 401 };
  if (!ROLES.includes(user.primary_role)) return { error: 'Akses ditolak.', status: 403 };
  return { user };
}

export async function GET(request) {
  try {
    const auth = requireAdmin(request);
    if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const destinationId = searchParams.get('destinationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = `
      SELECT q.*, d.name as destination_name, s.slot_name,
             (q.total_quota - q.reserved_quota - q.paid_quota) as available_quota
      FROM quotas q
      JOIN destinations d ON q.destination_id = d.id
      LEFT JOIN visit_slots s ON q.slot_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (destinationId) { query += ' AND q.destination_id = ?'; params.push(destinationId); }
    if (startDate) { query += ' AND q.visit_date >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND q.visit_date <= ?'; params.push(endDate); }
    query += ' ORDER BY q.visit_date ASC, d.name ASC LIMIT 200';

    const quotas = db.prepare(query).all(...params);
    return NextResponse.json({ success: true, quotas });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal memuat kuota.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = requireAdmin(request);
    if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const { destinationId, slotId, startDate, endDate, totalQuota } = await request.json();

    if (!destinationId || !startDate || !totalQuota) {
      return NextResponse.json({ success: false, message: 'destinationId, startDate, dan totalQuota wajib diisi.' }, { status: 400 });
    }
    if (totalQuota < 1 || totalQuota > 9999) {
      return NextResponse.json({ success: false, message: 'Total kuota harus antara 1 dan 9999.' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(startDate);
    const diffDays = Math.floor((end - start) / 86400000);
    if (diffDays > 30) return NextResponse.json({ success: false, message: 'Rentang tanggal maksimal 31 hari.' }, { status: 400 });

    let created = 0;
    let skipped = 0;
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO quotas (id, destination_id, slot_id, visit_date, total_quota, reserved_quota, paid_quota, is_active, version, created_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, 1, 1, datetime('now'))
    `);

    for (let i = 0; i <= diffDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const result = insertStmt.run('qta-' + crypto.randomUUID(), destinationId, slotId || null, dateStr, totalQuota);
      if (result.changes > 0) created++; else skipped++;
    }

    logAudit({ userId: auth.user.id, action: 'QUOTA_BULK_CREATED', entityType: 'Quota', newValues: { destinationId, startDate, endDate, totalQuota, created, skipped } });
    return NextResponse.json({ success: true, message: `${created} kuota berhasil dibuat, ${skipped} sudah ada.`, created, skipped });
  } catch (err) {
    console.error('Create quota error:', err);
    return NextResponse.json({ success: false, message: 'Gagal membuat kuota.' }, { status: 500 });
  }
}
