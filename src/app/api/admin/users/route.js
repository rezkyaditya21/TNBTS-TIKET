import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { logAudit } from '@/lib/auditLogger.js';
import db from '@/lib/db.js';

const ROLES = ['ADMIN_TNBTS', 'SUPER_ADMIN'];

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Autentikasi diperlukan.' }, { status: 401 });
    if (!ROLES.includes(user.primary_role)) return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const isActive = searchParams.get('isActive');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = 50;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];
    if (search) { where += ' AND (u.name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (role) { where += ' AND u.primary_role = ?'; params.push(role); }
    if (isActive !== null && isActive !== '') { where += ' AND u.is_active = ?'; params.push(isActive === 'true' ? 1 : 0); }

    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.primary_role, u.is_active, u.risk_score, u.created_at, u.last_login_at,
             (SELECT rs.score FROM risk_scores rs WHERE rs.user_id = u.id ORDER BY rs.created_at DESC LIMIT 1) as latest_risk_score
      FROM users u
      ${where}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM users u ${where}`).get(...params)?.count || 0;

    return NextResponse.json({ success: true, users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal memuat data pengguna.' }, { status: 500 });
  }
}
