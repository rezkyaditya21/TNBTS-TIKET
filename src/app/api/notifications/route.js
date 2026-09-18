import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import db from '@/lib/db.js';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Autentikasi diperlukan.' }, { status: 401 });

    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(user.id);

    const unreadCount = db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(user.id)?.count || 0;

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    return NextResponse.json({ success: false, message: 'Gagal memuat notifikasi.' }, { status: 500 });
  }
}
