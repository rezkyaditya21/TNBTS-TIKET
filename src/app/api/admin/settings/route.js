import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { logAudit } from '@/lib/auditLogger.js';
import db from '@/lib/db.js';

export async function GET(request) {
  try {
    const settings = db.prepare('SELECT * FROM system_settings').all();
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal memuat pengaturan.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getCurrentUser(request);
    if (!user || !['ADMIN_TNBTS', 'SUPER_ADMIN'].includes(user.primary_role)) {
      return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 });
    }

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
      userId: user.id,
      action: 'SYSTEM_STATUS_EMERGENCY_UPDATED',
      entityType: 'SystemSetting',
      newValues: { statusKawasan, statusNotice },
    });

    return NextResponse.json({
      success: true,
      message: 'Status kawasan & pengumuman resmi berhasil diperbarui seketika!',
    });
  } catch (err) {
    console.error('Update settings error:', err);
    return NextResponse.json({ success: false, message: 'Gagal memperbarui status.' }, { status: 500 });
  }
}
