import { NextResponse } from 'next/server';
import db from '@/lib/db.js';

export async function GET() {
  try {
    const destinations = db.prepare(`
      SELECT * FROM destinations WHERE is_active = 1 ORDER BY daily_capacity DESC
    `).all();

    const slots = db.prepare(`
      SELECT * FROM visit_slots WHERE is_active = 1
    `).all();

    const systemStatusSetting = db.prepare(`
      SELECT value FROM system_settings WHERE key = 'status_kawasan'
    `).get()?.value || 'OPEN';

    const systemNoticeSetting = db.prepare(`
      SELECT value FROM system_settings WHERE key = 'status_kawasan_notice'
    `).get()?.value || '';

    // Attach slots to destinations
    const result = destinations.map(d => ({
      ...d,
      slots: slots.filter(s => s.destination_id === d.id),
    }));

    return NextResponse.json({
      success: true,
      systemStatus: systemStatusSetting,
      systemNotice: systemNoticeSetting,
      destinations: result,
    });
  } catch (err) {
    console.error('Fetch destinations error:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat data destinasi.' },
      { status: 500 }
    );
  }
}
