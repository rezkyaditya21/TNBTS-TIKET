import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'tnbts.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('🌱 Starting TNBTS Master Database Seeder...');

// Ensure tables exist
const initSql = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    primary_role TEXT DEFAULT 'PENGUNJUNG',
    is_active INTEGER DEFAULT 1,
    is_verified INTEGER DEFAULT 0,
    risk_score INTEGER DEFAULT 0,
    last_login_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    module TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    PRIMARY KEY (user_id, role_id)
  );

  CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL,
    permission_id TEXT NOT NULL,
    PRIMARY KEY (role_id, permission_id)
  );

  CREATE TABLE IF NOT EXISTS destinations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    location_zone TEXT DEFAULT 'Bromo Tengger',
    cover_image_url TEXT,
    daily_capacity INTEGER DEFAULT 1000,
    ticket_price_domestic_weekday REAL DEFAULT 29000,
    ticket_price_domestic_weekend REAL DEFAULT 34000,
    ticket_price_foreign_weekday REAL DEFAULT 220000,
    ticket_price_foreign_weekend REAL DEFAULT 320000,
    insurance_fee REAL DEFAULT 5000,
    status TEXT DEFAULT 'OPEN',
    status_notice TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS visit_slots (
    id TEXT PRIMARY KEY,
    destination_id TEXT NOT NULL,
    slot_name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    slot_capacity INTEGER DEFAULT 500,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS quotas (
    id TEXT PRIMARY KEY,
    destination_id TEXT NOT NULL,
    slot_id TEXT,
    visit_date TEXT NOT NULL,
    total_quota INTEGER NOT NULL,
    reserved_quota INTEGER DEFAULT 0,
    paid_quota INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    version INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE (destination_id, slot_id, visit_date)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    booking_code TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    destination_id TEXT NOT NULL,
    slot_id TEXT,
    visit_date TEXT NOT NULL,
    total_visitors INTEGER DEFAULT 1,
    entrance_gate TEXT DEFAULT 'CEMORO_LAWANG',
    vehicle_type TEXT DEFAULT 'JEEP',
    vehicle_plate_number TEXT,
    subtotal_ticket_amount REAL DEFAULT 0,
    total_insurance_amount REAL DEFAULT 0,
    total_vehicle_fee REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'PENDING',
    cancellation_reason TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS booking_visitors (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    identity_type TEXT DEFAULT 'KTP',
    identity_number TEXT NOT NULL,
    citizenship TEXT DEFAULT 'DOMESTIK',
    ticket_price REAL DEFAULT 0,
    insurance_fee REAL DEFAULT 0,
    total_fee REAL DEFAULT 0,
    ticket_id TEXT
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    booking_id TEXT UNIQUE NOT NULL,
    quota_id TEXT NOT NULL,
    locked_slots INTEGER DEFAULT 1,
    session_id TEXT,
    ip_hash TEXT,
    expires_at TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    booking_id TEXT UNIQUE NOT NULL,
    provider TEXT DEFAULT 'MOCK_SANDBOX',
    payment_method TEXT DEFAULT 'QRIS',
    payment_code TEXT,
    qr_string TEXT,
    amount REAL NOT NULL,
    fee_amount REAL DEFAULT 0,
    total_paid REAL DEFAULT 0,
    status TEXT DEFAULT 'PENDING',
    external_transaction_id TEXT,
    paid_at TEXT,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payment_events (
    id TEXT PRIMARY KEY,
    payment_id TEXT,
    idempotency_key TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    raw_payload TEXT,
    is_processed INTEGER DEFAULT 0,
    processed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS refunds (
    id TEXT PRIMARY KEY,
    booking_id TEXT UNIQUE NOT NULL,
    requested_by_id TEXT NOT NULL,
    amount REAL NOT NULL,
    reason TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    bank_account_number TEXT NOT NULL,
    bank_account_holder TEXT NOT NULL,
    status TEXT DEFAULT 'REQUESTED',
    reviewed_by_id TEXT,
    reviewed_at TEXT,
    review_notes TEXT,
    processed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    ticket_code TEXT UNIQUE NOT NULL,
    booking_id TEXT NOT NULL,
    booking_visitor_id TEXT UNIQUE NOT NULL,
    destination_id TEXT NOT NULL,
    slot_id TEXT,
    visit_date TEXT NOT NULL,
    visitor_name TEXT NOT NULL,
    identity_number TEXT NOT NULL,
    entrance_gate TEXT DEFAULT 'CEMORO_LAWANG',
    status TEXT DEFAULT 'ISSUED',
    secret_token_salt TEXT NOT NULL,
    used_at TEXT,
    issued_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ticket_scans (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    scanned_by_user_id TEXT NOT NULL,
    gate_location TEXT NOT NULL,
    scan_result TEXT NOT NULL,
    response_message TEXT,
    is_offline_sync INTEGER DEFAULT 0,
    device_info TEXT,
    scanned_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS risk_scores (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    ip_hash TEXT NOT NULL,
    session_id TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    risk_level TEXT DEFAULT 'LOW',
    evaluated_signals TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS risk_events (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    risk_score_id TEXT,
    action_type TEXT NOT NULL,
    ip_hash TEXT NOT NULL,
    session_id TEXT NOT NULL,
    severity TEXT DEFAULT 'LOW',
    reason TEXT,
    payload_summary TEXT,
    action_taken TEXT DEFAULT 'ALLOW',
    status TEXT DEFAULT 'OPEN',
    review_notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'SYSTEM',
    action_url TEXT,
    is_read INTEGER DEFAULT 0,
    read_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    type TEXT DEFAULT 'string',
    group_name TEXT DEFAULT 'general',
    description TEXT
  );
`;

db.exec(initSql);

// 1. SEED ROLES
const roles = [
  { id: 'role-1', name: 'PENGUNJUNG', label: 'Pengunjung / Wisatawan', description: 'Masyarakat umum & wisatawan mancanegara' },
  { id: 'role-2', name: 'PETUGAS', label: 'Petugas Pos Gerbang', description: 'Ranger lapangan berwenang memindai QR tiket' },
  { id: 'role-3', name: 'ADMIN_TNBTS', label: 'Administrator Balai TNBTS', description: 'Pengelola kuota, destinasi, dan approval refund' },
  { id: 'role-4', name: 'OPERATOR_KEUANGAN', label: 'Operator Keuangan PNBP', description: 'Rekonsiliasi pembayaran & laporan PNBP' },
  { id: 'role-5', name: 'SUPER_ADMIN', label: 'Super Administrator Sistem', description: 'Akses penuh ke konfigurasi keamanan & audit' },
];

const insertRole = db.prepare('INSERT OR REPLACE INTO roles (id, name, label, description) VALUES (?, ?, ?, ?)');
roles.forEach(r => insertRole.run(r.id, r.name, r.label, r.description));
console.log('✅ 5 Roles seeded successfully.');

// 2. SEED DEFAULT USERS (Password: Bromo2026!)
const defaultPasswordHash = bcrypt.hashSync('Bromo2026!', 10);
const users = [
  { id: 'usr-superadmin', name: 'Super Admin TNBTS', email: 'superadmin@tnbts.go.id', role: 'SUPER_ADMIN', phone: '08110000001' },
  { id: 'usr-admin', name: 'Admin Operasional TNBTS', email: 'admin@tnbts.go.id', role: 'ADMIN_TNBTS', phone: '08110000002' },
  { id: 'usr-petugas', name: 'Petugas Ranger Gerbang', email: 'petugas@tnbts.go.id', role: 'PETUGAS', phone: '08110000003' },
  { id: 'usr-keuangan', name: 'Bendahara Keuangan PNBP', email: 'keuangan@tnbts.go.id', role: 'OPERATOR_KEUANGAN', phone: '08110000004' },
  { id: 'usr-wisatawan', name: 'Rezky Aditya (Wisatawan)', email: 'wisatawan@gmail.com', role: 'PENGUNJUNG', phone: '081234567890' },
];

const insertUser = db.prepare(`
  INSERT OR REPLACE INTO users (id, name, email, phone, password, primary_role, is_active, is_verified, risk_score)
  VALUES (?, ?, ?, ?, ?, ?, 1, 1, 0)
`);
users.forEach(u => insertUser.run(u.id, u.name, u.email, u.phone, defaultPasswordHash, u.role));
console.log('✅ 5 Sample users seeded (Password: Bromo2026!).');

// 3. SEED DESTINATIONS
const destinations = [
  {
    id: 'dest-1',
    name: 'Site Penanjakan 1 (Sunrise Spot)',
    code: 'PENANJAKAN_1',
    slug: 'penanjakan-1',
    description: 'Titik tertinggi dan paling spektakuler untuk menikmati golden sunrise berlatar belakang Gunung Bromo, Batok, dan Mahameru.',
    location_zone: 'Bromo Tengger (Tosari/Pasuruan)',
    cover_image_url: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80',
    daily_capacity: 800,
    ticket_price_domestic_weekday: 29000,
    ticket_price_domestic_weekend: 34000,
    ticket_price_foreign_weekday: 220000,
    ticket_price_foreign_weekend: 320000,
    insurance_fee: 5000,
    status: 'OPEN',
    status_notice: 'Kawasan aman, cuaca cerah berkabut tipis.',
  },
  {
    id: 'dest-2',
    name: 'Site Bukit Cinta (Love Hill)',
    code: 'BUKIT_CINTA',
    slug: 'bukit-cinta',
    description: 'Spot sunrise alternatif dengan panorama dinding kaldera Tengger yang megah dan spot foto ikonik.',
    location_zone: 'Bromo Tengger (Tosari/Pasuruan)',
    cover_image_url: 'https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=1200&q=80',
    daily_capacity: 400,
    ticket_price_domestic_weekday: 29000,
    ticket_price_domestic_weekend: 34000,
    ticket_price_foreign_weekday: 220000,
    ticket_price_foreign_weekend: 320000,
    insurance_fee: 5000,
    status: 'OPEN',
    status_notice: null,
  },
  {
    id: 'dest-3',
    name: 'Site Bukit Kedaluh (Kingkong Hill)',
    code: 'BUKIT_KEDALUH',
    slug: 'bukit-kedaluh',
    description: 'Tebing eksotis di bawah Penanjakan 1 yang menyuguhkan pemandangan lautan pasir dari sudut lebih dekat.',
    location_zone: 'Bromo Tengger (Tosari/Pasuruan)',
    cover_image_url: 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?auto=format&fit=crop&w=1200&q=80',
    daily_capacity: 600,
    ticket_price_domestic_weekday: 29000,
    ticket_price_domestic_weekend: 34000,
    ticket_price_foreign_weekday: 220000,
    ticket_price_foreign_weekend: 320000,
    insurance_fee: 5000,
    status: 'OPEN',
    status_notice: null,
  },
  {
    id: 'dest-4',
    name: 'Site Mentigen (Cemoro Lawang)',
    code: 'MENTIGEN',
    slug: 'mentigen',
    description: 'Spot sunrise favorit wisatawan di Cemoro Lawang Probolinggo, dapat dijangkau dengan jalan santai.',
    location_zone: 'Bromo Tengger (Ngadisari/Probolinggo)',
    cover_image_url: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?auto=format&fit=crop&w=1200&q=80',
    daily_capacity: 400,
    ticket_price_domestic_weekday: 29000,
    ticket_price_domestic_weekend: 34000,
    ticket_price_foreign_weekday: 220000,
    ticket_price_foreign_weekend: 320000,
    insurance_fee: 5000,
    status: 'OPEN',
    status_notice: null,
  },
  {
    id: 'dest-5',
    name: 'Site Laut Pasir & Kawah Bromo',
    code: 'LAUT_PASIR',
    slug: 'laut-pasir-kawah-bromo',
    description: 'Hamparan pasir berbisik, Pura Luhur Poten, dan pendakian tangga menuju bibir kawah aktif Bromo.',
    location_zone: 'Kaldera Bromo',
    cover_image_url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=1200&q=80',
    daily_capacity: 1200,
    ticket_price_domestic_weekday: 29000,
    ticket_price_domestic_weekend: 34000,
    ticket_price_foreign_weekday: 220000,
    ticket_price_foreign_weekend: 320000,
    insurance_fee: 5000,
    status: 'OPEN',
    status_notice: 'Wajib mengenakan masker antisipasi hembusan abu belerang.',
  },
  {
    id: 'dest-6',
    name: 'Kawasan Ranu Kumbolo & Ranupani',
    code: 'RANU_KUMBOLO',
    slug: 'ranu-kumbolo-ranupani',
    description: 'Danau air tawar alami di ketinggian 2.400 mdpl di kaki Gunung Semeru dengan panorama lembah cemara.',
    location_zone: 'Senduro / Lumajang',
    cover_image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    daily_capacity: 300,
    ticket_price_domestic_weekday: 34000,
    ticket_price_domestic_weekend: 39000,
    ticket_price_foreign_weekday: 250000,
    ticket_price_foreign_weekend: 350000,
    insurance_fee: 5000,
    status: 'LIMITED',
    status_notice: 'Aktivitas Semeru Level II (Waspada). Akses pendakian puncak ditutup sementara.',
  },
];

const insertDest = db.prepare(`
  INSERT OR REPLACE INTO destinations (
    id, name, code, slug, description, location_zone, cover_image_url,
    daily_capacity, ticket_price_domestic_weekday, ticket_price_domestic_weekend,
    ticket_price_foreign_weekday, ticket_price_foreign_weekend, insurance_fee,
    status, status_notice, is_active
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
`);

const insertSlot = db.prepare(`
  INSERT OR REPLACE INTO visit_slots (id, destination_id, slot_name, start_time, end_time, slot_capacity, is_active)
  VALUES (?, ?, ?, ?, ?, ?, 1)
`);

const insertQuota = db.prepare(`
  INSERT OR REPLACE INTO quotas (id, destination_id, slot_id, visit_date, total_quota, reserved_quota, paid_quota, is_active, version)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
`);

function getFormattedDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

destinations.forEach(dest => {
  insertDest.run(
    dest.id, dest.name, dest.code, dest.slug, dest.description, dest.location_zone,
    dest.cover_image_url, dest.daily_capacity, dest.ticket_price_domestic_weekday,
    dest.ticket_price_domestic_weekend, dest.ticket_price_foreign_weekday,
    dest.ticket_price_foreign_weekend, dest.insurance_fee, dest.status, dest.status_notice
  );

  const slotSunriseId = `${dest.id}-slot-sunrise`;
  const slotDaytimeId = `${dest.id}-slot-daytime`;
  const sunriseCap = Math.floor(dest.daily_capacity * 0.6);
  const daytimeCap = Math.floor(dest.daily_capacity * 0.4);

  insertSlot.run(slotSunriseId, dest.id, 'Sunrise Golden Hour (03:00 - 08:00)', '03:00', '08:00', sunriseCap);
  insertSlot.run(slotDaytimeId, dest.id, 'Daytime Exploration (08:00 - 16:00)', '08:00', '16:00', daytimeCap);

  // Generate 14 days of quota
  for (let i = 0; i <= 14; i++) {
    const vDate = getFormattedDate(i);

    const quotaSunriseId = `quota-${dest.code}-sunrise-${vDate}`;
    const mockReserved = (i === 1) ? 15 : 0;
    const mockPaid = (i === 1) ? Math.floor(sunriseCap * 0.3) : 0;
    insertQuota.run(quotaSunriseId, dest.id, slotSunriseId, vDate, sunriseCap, mockReserved, mockPaid);

    const quotaDaytimeId = `quota-${dest.code}-daytime-${vDate}`;
    insertQuota.run(quotaDaytimeId, dest.id, slotDaytimeId, vDate, daytimeCap, 0, 0);
  }
});
console.log('✅ 6 Iconic Destinations & 14-day Quota calendar generated.');

// 4. SEED SYSTEM SETTINGS
const settings = [
  { key: 'status_kawasan', value: 'OPEN', type: 'string', group: 'general', description: 'Status operasional kawasan (OPEN, LIMITED, CLOSED)' },
  { key: 'status_kawasan_notice', value: 'Kawasan Bromo beroperasi normal. Akses jalan dan cuaca terpantau cerah berkabut tipis.', type: 'string', group: 'general', description: 'Pemberitahuan darurat di banner situs' },
  { key: 'reservation_timeout_minutes', value: '15', type: 'integer', group: 'booking', description: 'Batas waktu kunci reservasi pembayaran (menit)' },
  { key: 'max_tickets_per_nik_weekly', value: '1', type: 'integer', group: 'anti_abuse', description: 'Maksimal pembelian tiket per NIK dalam 7 hari' },
  { key: 'risk_challenge_threshold', value: '35', type: 'integer', group: 'anti_abuse', description: 'Skor risiko yang memicu verifikasi tambahan' },
  { key: 'risk_block_threshold', value: '70', type: 'integer', group: 'anti_abuse', description: 'Skor risiko yang langsung menolak/menahan transaksi' },
  { key: 'payment_mock_mode', value: 'true', type: 'boolean', group: 'payment', description: 'Mode simulasi instant approval QRIS/VA sandbox' },
];

const insertSetting = db.prepare(`
  INSERT OR REPLACE INTO system_settings (id, key, value, type, group_name, description)
  VALUES (?, ?, ?, ?, ?, ?)
`);
settings.forEach(s => insertSetting.run(`set-${s.key}`, s.key, s.value, s.type, s.group, s.description));
console.log('✅ Anti-Abuse & Business System Settings seeded.');

console.log('🎉 TNBTS Phase 1 Database Seed Completed Successfully!');
