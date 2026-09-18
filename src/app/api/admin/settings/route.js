import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { logAudit } from '@/lib/auditLogger.js';
import db from '@/lib/db.js';

const ADMIN_ROLES = ['ADMIN_TNBTS', 'OPERATOR_KEUANGAN', 'SUPER_ADMIN'];
const SUPER_ROLES = ['ADMIN_TNBTS', 'SUPER_ADMIN'];

function requireRole(request, roles) {
  const user = getCurrentUser(request);
  if (!user) return { error: 'Autentikasi diperlukan.', status: 401 };
  if (!roles.includes(user.primary_role)) return { error: 'Akses ditolak.', status: 403 };
  return { user };
}

export async function GET(request) {
  try {
    const auth = requireRole(request, ADMIN_ROLES);
    if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const settings = db.prepare('SELECT * FROM system_settings').all();
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal memuat pengaturan.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = requireRole(request, SUPER_ROLES);
    if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const { statusKawasan, statusNotice } = await request.json();

    if (statusKawasan) {
      db.prepare(`
        INSERT INTO system_settings (id, key, value, type, group_name, description)
        VALUES ('set-status_kawasan', 'status_kawasan', ?, 'string', 'general', 'Status operasional kawasan')
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(statusKawasan);
    }

    if (statusNotice !== undefined) {
      db.prepare(`
        INSERT INTO system_settings (id, key, value, type, group_name, description)
        VALUES ('set-status_kawasan_notice', 'status_kawasan_notice', ?, 'string', 'general', 'Pemberitahuan darurat di banner')
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(statusNotice);
    }

    logAudit({
      userId: auth.user.id,
      action: 'SYSTEM_STATUS_EMERGENCY_UPDATED',
      entityType: 'SystemSetting',
      newValues: { statusKawasan, statusNotice },
    });

    return NextResponse.json({ success: true, message: 'Status kawasan berhasil diperbarui.' });
  } catch (err) {
    console.error('Update settings error:', err);
    return NextResponse.json({ success: false, message: 'Gagal memperbarui status.' }, { status: 500 });
  }
}
