import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import db from '@/lib/db.js';

export async function GET(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Silakan login.' },
        { status: 401 }
      );
    }

    const isStaff = ['ADMIN_TNBTS', 'SUPER_ADMIN', 'OPERATOR_KEUANGAN'].includes(user.primary_role);
    if (!isStaff) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak: Area khusus administrator Balai TNBTS.' },
        { status: 403 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Summary Statistics
    const todayStats = db.prepare(`
      SELECT 
        COUNT(CASE WHEN b.status = 'PAID' THEN 1 END) as paid_bookings,
        COUNT(CASE WHEN b.status = 'RESERVED' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN b.status = 'CANCELLED' THEN 1 END) as cancelled_bookings,
        COALESCE(SUM(CASE WHEN b.status = 'PAID' THEN b.total_visitors ELSE 0 END), 0) as paid_visitors,
        COALESCE(SUM(CASE WHEN b.status = 'PAID' THEN b.total_amount ELSE 0 END), 0) as total_revenue
      FROM bookings b
      WHERE date(b.created_at) = ?
    `).get(today);

    // Gate Check-in Count
    const checkinCount = db.prepare(`
      SELECT COUNT(*) as scanned_today
      FROM ticket_scans
      WHERE scan_result = 'VALID' AND date(scanned_at) = ?
    `).get(today)?.scanned_today || 0;

    // Suspicious Activity Count
    const suspiciousCount = db.prepare(`
      SELECT COUNT(*) as count FROM risk_events WHERE status = 'OPEN'
    `).get()?.count || 0;

    // Quotas Today
    const quotaSummary = db.prepare(`
      SELECT d.name as destination_name, q.total_quota, q.reserved_quota, q.paid_quota,
             (q.total_quota - (q.reserved_quota + q.paid_quota)) as available_quota
      FROM quotas q
      JOIN destinations d ON q.destination_id = d.id
      WHERE q.visit_date = ?
      LIMIT 6
    `).all(today);

    // Recent Bookings
    const recentBookings = db.prepare(`
      SELECT b.id, b.booking_code, b.visit_date, b.total_visitors, b.total_amount, b.status, b.created_at,
             u.name as user_name, u.email as user_email, d.name as destination_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN destinations d ON b.destination_id = d.id
      ORDER BY b.created_at DESC
      LIMIT 8
    `).all();

    // Recent Scans
    const recentScans = db.prepare(`
      SELECT s.*, t.ticket_code, t.visitor_name, u.name as officer_name
      FROM ticket_scans s
      JOIN tickets t ON s.ticket_id = t.id
      JOIN users u ON s.scanned_by_user_id = u.id
      ORDER BY s.scanned_at DESC
      LIMIT 6
    `).all();

    // System Settings
    const systemStatus = db.prepare(`SELECT value FROM system_settings WHERE key = 'status_kawasan'`).get()?.value || 'OPEN';

    return NextResponse.json({
      success: true,
      stats: {
        paidBookings: todayStats?.paid_bookings || 0,
        pendingBookings: todayStats?.pending_bookings || 0,
        cancelledBookings: todayStats?.cancelled_bookings || 0,
        paidVisitors: todayStats?.paid_visitors || 0,
        totalRevenue: todayStats?.total_revenue || 0,
        scannedToday: checkinCount,
        suspiciousEvents: suspiciousCount,
        systemStatus,
      },
      quotaSummary,
      recentBookings,
      recentScans,
    });
  } catch (err) {
    console.error('Admin dashboard stats error:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat ringkasan dashboard.' },
      { status: 500 }
    );
  }
}
