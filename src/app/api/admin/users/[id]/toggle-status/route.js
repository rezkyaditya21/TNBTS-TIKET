import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { logAudit } from '@/lib/auditLogger.js';
import db from '@/lib/db.js';

export async function POST(request, { params }) {
  try {
    const admin = getCurrentUser(request);
    if (!admin) return NextResponse.json({ success: false, message: 'Autentikasi diperlukan.' }, { status: 401 });
    if (!['ADMIN_TNBTS', 'SUPER_ADMIN'].includes(admin.primary_role)) {
      return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 });
    }

    const { id } = await params;
    if (id === admin.id) return NextResponse.json({ success: false, message: 'Tidak dapat mengubah status akun Anda sendiri.' }, { status: 400 });

    const target = db.prepare('SELECT id, name, is_active FROM users WHERE id = ?').get(id);
    if (!target) return NextResponse.json({ success: false, message: 'Pengguna tidak ditemukan.' }, { status: 404 });

    const newStatus = target.is_active ? 0 : 1;
    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newStatus, id);

    logAudit({
      userId: admin.id,
      action: newStatus ? 'USER_ACTIVATED' : 'USER_BLOCKED',
      entityType: 'User', entityId: id,
      newValues: { targetName: target.name, isActive: Boolean(newStatus) },
    });

    return NextResponse.json({ success: true, message: `Akun berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`, isActive: Boolean(newStatus) });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal mengubah status akun.' }, { status: 500 });
  }
}
