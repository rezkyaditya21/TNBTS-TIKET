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
    const { totalQuota, isActive } = await request.json();

    const quota = db.prepare('SELECT * FROM quotas WHERE id = ?').get(id);
    if (!quota) return NextResponse.json({ success: false, message: 'Kuota tidak ditemukan.' }, { status: 404 });

    if (totalQuota !== undefined) {
      const minAllowed = quota.reserved_quota + quota.paid_quota;
      if (totalQuota < minAllowed) {
        return NextResponse.json({ success: false, message: `Total kuota tidak boleh kurang dari kuota terpakai (${minAllowed}).` }, { status: 400 });
      }
      if (totalQuota < 1 || totalQuota > 9999) {
        return NextResponse.json({ success: false, message: 'Total kuota harus antara 1 dan 9999.' }, { status: 400 });
      }
    }

    db.prepare(`
      UPDATE quotas
      SET total_quota = COALESCE(?, total_quota), is_active = COALESCE(?, is_active), version = version + 1
      WHERE id = ?
    `).run(totalQuota ?? null, isActive !== undefined ? (isActive ? 1 : 0) : null, id);

    logAudit({ userId: user.id, action: 'QUOTA_UPDATED', entityType: 'Quota', entityId: id, newValues: { totalQuota, isActive } });
    return NextResponse.json({ success: true, message: 'Kuota berhasil diperbarui.' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal memperbarui kuota.' }, { status: 500 });
  }
}
