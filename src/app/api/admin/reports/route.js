import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import db from '@/lib/db.js';

const ALLOWED = ['ADMIN_TNBTS', 'OPERATOR_KEUANGAN', 'SUPER_ADMIN'];

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Autentikasi diperlukan.' }, { status: 401 });
    if (!ALLOWED.includes(user.primary_role)) return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format'); // 'csv' or null (summary)
    const today = new Date().toISOString().split('T')[0];
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 30);
    const startDate = searchParams.get('startDate') || defaultStart.toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || today;

    if (format === 'csv') {
      const rows = db.prepare(`
        SELECT b.booking_code, b.visit_date, d.name as destination_name,
               b.total_visitors, p.payment_method, b.total_amount,
               p.status as payment_status, p.paid_at,
               SUM(CASE WHEN bv.citizenship = 'DOMESTIK' THEN 1 ELSE 0 END) as domestic_count,
               SUM(CASE WHEN bv.citizenship = 'MANCANEGARA' THEN 1 ELSE 0 END) as foreign_count
        FROM bookings b
        JOIN destinations d ON b.destination_id = d.id
        LEFT JOIN payments p ON b.id = p.booking_id
        LEFT JOIN booking_visitors bv ON b.id = bv.booking_id
        WHERE b.status = 'PAID' AND b.visit_date BETWEEN ? AND ?
        GROUP BY b.id
        ORDER BY b.visit_date ASC
      `).all(startDate, endDate);

      const header = 'booking_code,visit_date,destination_name,total_visitors,payment_method,total_amount,payment_status,paid_at,citizen_type_breakdown\n';
      const csvRows = rows.map(r =>
        `"${r.booking_code}","${r.visit_date}","${r.destination_name}",${r.total_visitors},"${r.payment_method || ''}",${r.total_amount},"${r.payment_status || ''}","${r.paid_at || ''}","DOM:${r.domestic_count} WNA:${r.foreign_count}"`
      ).join('\n');

      return new NextResponse(header + csvRows, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="tnbts-pnbp-${startDate}-${endDate}.csv"`,
        },
      });
    }

    // Summary
    const summary = db.prepare(`
      SELECT d.name as destination_name,
             COUNT(b.id) as total_transactions,
             SUM(b.total_visitors) as total_visitors,
             SUM(b.total_amount) as total_revenue
      FROM bookings b
      JOIN destinations d ON b.destination_id = d.id
      WHERE b.status = 'PAID' AND b.visit_date BETWEEN ? AND ?
      GROUP BY b.destination_id
      ORDER BY total_revenue DESC
    `).all(startDate, endDate);

    const totals = db.prepare(`
      SELECT COUNT(id) as total_transactions, SUM(total_visitors) as total_visitors, SUM(total_amount) as total_revenue
      FROM bookings WHERE status = 'PAID' AND visit_date BETWEEN ? AND ?
    `).get(startDate, endDate);

    return NextResponse.json({ success: true, summary, totals, startDate, endDate });
  } catch (err) {
    console.error('Reports error:', err);
    return NextResponse.json({ success: false, message: 'Gagal memuat laporan.' }, { status: 500 });
  }
}
