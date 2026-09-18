import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'tnbts.db');

// Singleton connection with WAL mode
let db;
if (!global.__tnbts_db) {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  global.__tnbts_db = db;
} else {
  db = global.__tnbts_db;
}

export function initDatabase() {
  db.exec(`
    -- 1. USERS & RBAC
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
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT NOT NULL,
      permission_id TEXT NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    );

    -- 2. VISITOR PROFILES & IDENTITY
    CREATE TABLE IF NOT EXISTS visitor_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      identity_type TEXT DEFAULT 'KTP',
      nik_or_passport TEXT NOT NULL,
      citizenship TEXT DEFAULT 'DOMESTIK',
      gender TEXT,
      birth_date TEXT,
      address TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      is_identity_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS identity_verifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      nik_or_passport TEXT NOT NULL,
      id_card_photo_path TEXT,
      selfie_photo_path TEXT,
      status TEXT DEFAULT 'PENDING',
      notes TEXT,
      verified_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 3. DESTINATIONS, SLOTS, & QUOTA
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
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
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
      UNIQUE (destination_id, slot_id, visit_date),
      FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
      FOREIGN KEY (slot_id) REFERENCES visit_slots(id) ON DELETE SET NULL
    );

    -- 4. BOOKINGS, VISITORS, & RESERVATIONS
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
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
      FOREIGN KEY (slot_id) REFERENCES visit_slots(id) ON DELETE SET NULL
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
      ticket_id TEXT,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
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
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (quota_id) REFERENCES quotas(id) ON DELETE CASCADE
    );

    -- 5. PAYMENTS & REFUNDS
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
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
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
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
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
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (requested_by_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 6. TICKETS & SCANS
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
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (booking_visitor_id) REFERENCES booking_visitors(id) ON DELETE CASCADE,
      FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
      FOREIGN KEY (slot_id) REFERENCES visit_slots(id) ON DELETE SET NULL
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
      scanned_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (scanned_by_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 7. RISK & ANTI-ABUSE ENGINE
    CREATE TABLE IF NOT EXISTS risk_scores (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      ip_hash TEXT NOT NULL,
      session_id TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      risk_level TEXT DEFAULT 'LOW',
      evaluated_signals TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (risk_score_id) REFERENCES risk_scores(id) ON DELETE SET NULL
    );

    -- 8. NOTIFICATIONS, AUDIT & SETTINGS
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'SYSTEM',
      action_url TEXT,
      is_read INTEGER DEFAULT 0,
      read_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      type TEXT DEFAULT 'string',
      group_name TEXT DEFAULT 'general',
      description TEXT
    );

    -- INDEXES FOR MAXIMUM QUERY EFFICIENCY & CONCURRENCY
    CREATE INDEX IF NOT EXISTS idx_quotas_lookup ON quotas(destination_id, slot_id, visit_date);
    CREATE INDEX IF NOT EXISTS idx_reservations_status_exp ON reservations(status, expires_at);
    CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(ticket_code);
    CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_visitors_nik ON booking_visitors(identity_number);

    -- 9. PERSISTENT RATE LIMITER
    CREATE TABLE IF NOT EXISTS rate_limit_entries (
      key TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      window_start INTEGER NOT NULL,
      window_ms INTEGER NOT NULL,
      PRIMARY KEY (key)
    );
  `);
}

// Auto-initialize all tables on first server start
if (!global.__tnbts_db_initialized) {
  global.__tnbts_db_initialized = true;
  try { initDatabase(); } catch (e) { console.error('DB init error:', e); }
}

export default db;
