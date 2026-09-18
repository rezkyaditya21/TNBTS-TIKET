import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import db from '@/lib/db.js';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Autentikasi diperlukan.' }, { status: 401 });
    if (!['ADMIN_TNBTS', 'SUPER_ADMIN'].includes(user.primary_role)) {
      return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 });
    }
    const destinations = db.prepare('SELECT * FROM destinations ORDER BY name').all();
    return NextResponse.json({ success: true, destinations });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal memuat destinasi.' }, { status: 500 });
  }
}
