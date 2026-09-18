import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import db from '@/lib/db.js';

export async function POST(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Autentikasi diperlukan.' }, { status: 401 });

    db.prepare(`
      UPDATE notifications
      SET is_read = 1, read_at = datetime('now')
      WHERE user_id = ? AND is_read = 0
    `).run(user.id);

    return NextResponse.json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca.' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal memperbarui notifikasi.' }, { status: 500 });
  }
}
