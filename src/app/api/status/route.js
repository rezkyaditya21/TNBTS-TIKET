import { NextResponse } from 'next/server';
import db from '@/lib/db.js';

export async function GET() {
  try {
    const destinations = db.prepare(
      'SELECT id, name, code, status, status_notice, daily_capacity, location_zone FROM destinations WHERE is_active = 1 ORDER BY name'
    ).all();

    const settings = db.prepare("SELECT key, value FROM system_settings WHERE key IN ('status_kawasan', 'status_kawasan_notice')").all();
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));

    return NextResponse.json({
      success: true,
      kawasan: {
        status: settingsMap.status_kawasan || 'OPEN',
        notice: settingsMap.status_kawasan_notice || '',
      },
      destinations,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal memuat status kawasan.' }, { status: 500 });
  }
}
