import { NextResponse } from 'next/server';
import db from '@/lib/db.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const destinationId = searchParams.get('destinationId');
    const visitDate = searchParams.get('date');

    if (!destinationId) {
      return NextResponse.json(
        { success: false, message: 'ID Destinasi wajib dicantumkan.' },
        { status: 400 }
      );
    }

    let query = `
      SELECT q.*, s.slot_name, s.start_time, s.end_time,
             (q.total_quota - (q.reserved_quota + q.paid_quota)) as available_quota
      FROM quotas q
      LEFT JOIN visit_slots s ON q.slot_id = s.id
      WHERE q.destination_id = ?
    `;
    const params = [destinationId];

    if (visitDate) {
      query += ` AND q.visit_date = ?`;
      params.push(visitDate);
    } else {
      query += ` AND date(q.visit_date) >= date('now') ORDER BY q.visit_date ASC LIMIT 30`;
    }

    const quotas = db.prepare(query).all(...params);

    return NextResponse.json({
      success: true,
      quotas: quotas.map(q => ({
        ...q,
        available_quota: Math.max(0, q.available_quota),
      })),
    });
  } catch (err) {
    console.error('Fetch quota error:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat informasi kuota.' },
      { status: 500 }
    );
  }
}
