import crypto from 'crypto';
import db from './db.js';
import { logAudit } from './auditLogger.js';

const APP_SECRET = process.env.APP_KEY || 'tnbts-cryptographic-salt-super-secret-2026';

/**
 * Generate Dynamic Time-Rolling Ticket Token (45 seconds validity).
 * Screenshot prevention: Screen captures expire in 45s.
 */
export function generateRollingToken(ticketId, secretSalt, timeStep = 45) {
  const nowSec = Math.floor(Date.now() / 1000);
  const currentWindow = Math.floor(nowSec / timeStep);
  const secondsRemaining = timeStep - (nowSec % timeStep);

  const payload = `${ticketId}|${currentWindow}|${secretSalt}`;
  const hmac = crypto.createHmac('sha256', APP_SECRET).update(payload).digest('hex');
  const token = `${hmac.substring(0, 16)}.${currentWindow}`;

  return { token, currentWindow, secondsRemaining };
}

/**
 * Verify Dynamic Rolling Token with 1 window drift tolerance.
 */
export function verifyRollingToken(ticketId, secretSalt, providedToken, timeStep = 45) {
  if (!providedToken || typeof providedToken !== 'string') return false;

  const parts = providedToken.split('.');
  if (parts.length !== 2) return false;

  const [tokenHash, tokenWindowStr] = parts;
  const tokenWindow = parseInt(tokenWindowStr, 10);
  if (isNaN(tokenWindow)) return false;

  const nowSec = Math.floor(Date.now() / 1000);
  const currentWindow = Math.floor(nowSec / timeStep);

  // Allow max 1 window before/after (drift window tolerance)
  if (Math.abs(currentWindow - tokenWindow) > 1) {
    return false;
  }

  const payload = `${ticketId}|${tokenWindow}|${secretSalt}`;
  const expectedHash = crypto.createHmac('sha256', APP_SECRET).update(payload).digest('hex').substring(0, 16);

  return crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(tokenHash));
}

/**
 * Gate Officer Scanner Validation Engine
 * Validates ticket, prevents double scan, checks visit date, and logs scan result.
 */
export function validateTicketScan({
  ticketCode,
  providedToken,
  officerUserId,
  gateLocation = 'CEMORO_LAWANG',
  deviceInfo = 'Ranger-Mobile-Scanner',
  isOfflineSync = false,
  bypassTokenCheck = false, // for manual physical fallback if offline
}) {
  const ticket = db.prepare(`
    SELECT t.*, d.name as destination_name, b.booking_code, b.entrance_gate as booking_gate
    FROM tickets t
    JOIN destinations d ON t.destination_id = d.id
    JOIN bookings b ON t.booking_id = b.id
    WHERE t.ticket_code = ?
  `).get(ticketCode);

  const scanId = 'scn-' + crypto.randomUUID();

  const recordScan = (result, message) => {
    try {
      db.prepare(`
        INSERT INTO ticket_scans (id, ticket_id, scanned_by_user_id, gate_location, scan_result, response_message, is_offline_sync, device_info, scanned_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(scanId, ticket ? ticket.id : 'unknown', officerUserId, gateLocation, result, message, isOfflineSync ? 1 : 0, deviceInfo);
    } catch (err) {
      console.error('Failed to log ticket scan:', err);
    }
  };

  if (!ticket) {
    recordScan('INVALID_SIGNATURE', 'Kode tiket tidak ditemukan di sistem.');
    return {
      isValid: false,
      resultCode: 'NOT_FOUND',
      message: 'Tiket tidak terdaftar di sistem resmi TNBTS.',
    };
  }

  // Double scan check
  if (ticket.status === 'USED') {
    recordScan('ALREADY_USED', `Tiket telah digunakan sebelumnya pada ${ticket.used_at}`);
    return {
      isValid: false,
      resultCode: 'ALREADY_USED',
      message: `TIKET SUDAH PERNAH DIGUNAKAN pada ${ticket.used_at}! Dugaan duplikasi barcode.`,
      ticket: {
        ticketCode: ticket.ticket_code,
        visitorName: ticket.visitor_name,
        usedAt: ticket.used_at,
      },
    };
  }

  if (ticket.status !== 'ISSUED') {
    recordScan('EXPIRED', `Status tiket tidak valid: ${ticket.status}`);
    return {
      isValid: false,
      resultCode: 'INVALID_STATUS',
      message: `Status tiket tidak aktif (${ticket.status}). Tiket mungkin telah dibatalkan atau kedaluwarsa.`,
    };
  }

  // Verify dynamic rolling token
  if (!bypassTokenCheck && providedToken) {
    const isTokenValid = verifyRollingToken(ticket.id, ticket.secret_token_salt, providedToken);
    if (!isTokenValid) {
      recordScan('INVALID_SIGNATURE', 'Token dinamis tidak cocok atau telah kedaluwarsa (kemungkinan screenshot).');
      return {
        isValid: false,
        resultCode: 'EXPIRED_OR_SCREENSHOT',
        message: 'QR CODE TELAH KEDALUWARSA (Dugaan Screenshot)! Minta pengunjung membuka tiket langsung dari aplikasi web.',
      };
    }
  }

  // Mark as USED
  const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);
  db.prepare(`UPDATE tickets SET status = 'USED', used_at = ? WHERE id = ?`).run(nowIso, ticket.id);

  recordScan('VALID', 'Tiket diverifikasi berhasil.');

  logAudit({
    userId: officerUserId,
    action: 'TICKET_SCANNED_CHECKIN_SUCCESS',
    entityType: 'Ticket',
    entityId: ticket.id,
    newValues: { ticketCode: ticket.ticket_code, visitor: ticket.visitor_name, gate: gateLocation },
  });

  return {
    isValid: true,
    resultCode: 'VALID',
    message: 'TIKET RESMI & VALID! Silakan masuk.',
    ticket: {
      ticketCode: ticket.ticket_code,
      bookingCode: ticket.booking_code,
      visitorName: ticket.visitor_name,
      identityNumber: ticket.identity_number,
      destinationName: ticket.destination_name,
      visitDate: ticket.visit_date,
      entranceGate: ticket.booking_gate,
      usedAt: nowIso,
    },
  };
}
