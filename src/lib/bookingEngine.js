import db from './db.js';
import crypto from 'crypto';
import { checkActiveReservationLimit, checkNikPurchaseLimit, calculateBehavioralRisk } from './antiAbuse.js';
import { logAudit } from './auditLogger.js';

/**
 * Sweeper to automatically release expired reservations and return quota to pool.
 */
export function revertExpiredReservations() {
  const expiredList = db.prepare(`
    SELECT r.id as reservation_id, r.quota_id, r.locked_slots, r.booking_id, b.booking_code
    FROM reservations r
    JOIN bookings b ON r.booking_id = b.id
    WHERE r.status = 'ACTIVE' AND r.expires_at < datetime('now')
  `).all();

  if (expiredList.length === 0) return 0;

  const revertTx = db.transaction(() => {
    const updateQuota = db.prepare(`
      UPDATE quotas
      SET reserved_quota = MAX(0, reserved_quota - ?),
          version = version + 1
      WHERE id = ?
    `);

    const updateReservation = db.prepare(`
      UPDATE reservations
      SET status = 'EXPIRED'
      WHERE id = ?
    `);

    const updateBooking = db.prepare(`
      UPDATE bookings
      SET status = 'CANCELLED',
          cancellation_reason = 'Batas waktu pembayaran 15 menit telah habis (Auto-expired).'
      WHERE id = ?
    `);

    for (const exp of expiredList) {
      updateQuota.run(exp.locked_slots, exp.quota_id);
      updateReservation.run(exp.reservation_id);
      updateBooking.run(exp.booking_id);

      logAudit({
        action: 'RESERVATION_AUTO_EXPIRED',
        entityType: 'Reservation',
        entityId: exp.reservation_id,
        newValues: { bookingCode: exp.booking_code, restoredQuota: exp.locked_slots },
      });
    }
  });

  revertTx();
  return expiredList.length;
}

/**
 * Concurrency-Safe Booking & Reservation Creator
 * Runs in an ACID immediate transaction to eliminate race conditions.
 */
export function createBookingReservation({
  userId,
  userEmail,
  destinationId,
  slotId,
  visitDate,
  entranceGate = 'CEMORO_LAWANG',
  vehicleType = 'JEEP',
  vehiclePlateNumber = '',
  visitors = [],
  sessionId = 'sess-default',
  ip = '127.0.0.1',
  userAgent = 'Mozilla/5.0',
  formFillDurationMs = 5000,
}) {
  // 1. Cleanup any expired reservations first
  revertExpiredReservations();

  // 2. Validate visitor payload
  if (!visitors || visitors.length === 0) {
    throw new Error('Data pengunjung wajib diisi minimal 1 orang.');
  }

  // 3. Behavioral Risk Check
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
  const recentExpired = db.prepare(`
    SELECT COUNT(*) as count FROM reservations r
    JOIN bookings b ON r.booking_id = b.id
    WHERE b.user_id = ? AND r.status = 'EXPIRED'
  `).get(userId)?.count || 0;

  const riskResult = calculateBehavioralRisk({
    userId,
    ipHash,
    sessionId,
    formSubmissionTimeMs: formFillDurationMs,
    recentExpiredCount: recentExpired,
  });

  if (riskResult.actionTaken === 'THROTTLE') {
    throw new Error('Aktivitas pemesanan terdeteksi tidak wajar. Mohon tunggu beberapa saat sebelum mencoba kembali.');
  }

  // 4. Anti-Hoarding Check: 1 Active reservation per user
  const activeRes = checkActiveReservationLimit(userId);
  if (activeRes) {
    throw new Error(`Anda masih memiliki pesanan aktif (${activeRes.booking_code}) yang belum diselesaikan. Selesaikan pembayaran atau batalkan terlebih dahulu.`);
  }

  // 5. Anti-Scalper Check: 1 NIK max 1 booking per week
  const nids = visitors.map(v => v.identityNumber.trim());
  const nikViolations = checkNikPurchaseLimit(nids, visitDate);
  if (nikViolations.length > 0) {
    const v = nikViolations[0];
    throw new Error(`NIK ${v.nik} (${v.name}) sudah terdaftar pada kunjungan tanggal ${v.existingDate} (${v.bookingCode}). 1 NIK dibatasi 1 tiket per minggu untuk mencegah monopoli calo.`);
  }

  // 6. Execute Concurrency-Safe Transaction
  const executeBookingTx = db.transaction(() => {
    // Check Destination
    const destination = db.prepare('SELECT * FROM destinations WHERE id = ?').get(destinationId);
    if (!destination || !destination.is_active || destination.status === 'CLOSED') {
      throw new Error('Destinasi tidak tersedia atau sedang ditutup oleh pihak Balai TNBTS.');
    }

    // Atomic Quota Lookup & Lock
    const quota = db.prepare(`
      SELECT * FROM quotas
      WHERE destination_id = ? AND slot_id = ? AND visit_date = ?
    `).get(destinationId, slotId, visitDate);

    if (!quota || !quota.is_active) {
      throw new Error(`Kuota untuk tanggal ${visitDate} pada slot ini belum dibuka.`);
    }

    const availableSlots = quota.total_quota - (quota.reserved_quota + quota.paid_quota);
    const requestedCount = visitors.length;

    if (availableSlots < requestedCount) {
      throw new Error(`Kuota tidak mencukupi! Sisa kuota tersedia: ${availableSlots} orang.`);
    }

    // Atomically increment reserved_quota
    db.prepare(`
      UPDATE quotas
      SET reserved_quota = reserved_quota + ?,
          version = version + 1
      WHERE id = ?
    `).run(requestedCount, quota.id);

    // Calculate Pricing
    const isWeekend = (new Date(visitDate).getDay() === 0 || new Date(visitDate).getDay() === 6);
    let subtotalTicket = 0;
    let totalInsurance = 0;
    const insurancePerPerson = Number(destination.insurance_fee) || 5000;

    const visitorEntities = visitors.map(v => {
      const isDomestic = v.citizenship === 'DOMESTIK';
      let price = isDomestic
        ? (isWeekend ? Number(destination.ticket_price_domestic_weekend) : Number(destination.ticket_price_domestic_weekday))
        : (isWeekend ? Number(destination.ticket_price_foreign_weekend) : Number(destination.ticket_price_foreign_weekday));

      subtotalTicket += price;
      totalInsurance += insurancePerPerson;

      return {
        id: 'bv-' + crypto.randomUUID(),
        fullName: v.fullName.trim(),
        identityType: v.identityType || 'KTP',
        identityNumber: v.identityNumber.trim(),
        citizenship: v.citizenship || 'DOMESTIK',
        ticketPrice: price,
        insuranceFee: insurancePerPerson,
        totalFee: price + insurancePerPerson,
      };
    });

    const vehicleFeeMap = { JEEP: 10000, MOBIL: 15000, MOTOR: 5000, SEPEDA: 2000, JALAN_KAKI: 0 };
    const vehicleFee = vehicleFeeMap[vehicleType] || 0;
    const grandTotal = subtotalTicket + totalInsurance + vehicleFee;

    // Create Booking
    const bookingId = 'bkg-' + crypto.randomUUID();
    const dateStr = visitDate.replace(/-/g, '');
    const bookingCode = `TNBTS-${dateStr}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    db.prepare(`
      INSERT INTO bookings (
        id, booking_code, user_id, destination_id, slot_id, visit_date,
        total_visitors, entrance_gate, vehicle_type, vehicle_plate_number,
        subtotal_ticket_amount, total_insurance_amount, total_vehicle_fee, total_amount,
        status, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RESERVED', ?, ?, datetime('now'))
    `).run(
      bookingId, bookingCode, userId, destinationId, slotId, visitDate,
      requestedCount, entranceGate, vehicleType, vehiclePlateNumber,
      subtotalTicket, totalInsurance, vehicleFee, grandTotal,
      ip, userAgent
    );

    // Insert Visitors
    const insertVisitorStmt = db.prepare(`
      INSERT INTO booking_visitors (
        id, booking_id, full_name, identity_type, identity_number, citizenship,
        ticket_price, insurance_fee, total_fee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const v of visitorEntities) {
      insertVisitorStmt.run(v.id, bookingId, v.fullName, v.identityType, v.identityNumber, v.citizenship, v.ticketPrice, v.insuranceFee, v.totalFee);
    }

    // Create 15-minute Reservation Lock
    const reservationId = 'res-' + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

    db.prepare(`
      INSERT INTO reservations (
        id, booking_id, quota_id, locked_slots, session_id, ip_hash, expires_at, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', datetime('now'))
    `).run(reservationId, bookingId, quota.id, requestedCount, sessionId, ipHash, expiresAt);

    // Create Payment Record
    const paymentId = 'pay-' + crypto.randomUUID();
    const paymentCode = 'VA88' + Math.floor(1000000000 + Math.random() * 9000000000);
    const qrString = `00020101021226600016ID.CO.TNBTS.WWW01189360099${bookingCode}520458125303360540${grandTotal}5802ID5910TNBTS BROMO6007MALANG6304`;

    db.prepare(`
      INSERT INTO payments (
        id, booking_id, provider, payment_method, payment_code, qr_string,
        amount, fee_amount, total_paid, status, expires_at, created_at
      ) VALUES (?, ?, 'MOCK_SANDBOX', 'QRIS', ?, ?, ?, 0, 0, 'PENDING', ?, datetime('now'))
    `).run(paymentId, bookingId, paymentCode, qrString, grandTotal, expiresAt);

    // Audit Log
    logAudit({
      userId,
      userEmail,
      action: 'BOOKING_RESERVED_CONCURRENCY_LOCKED',
      entityType: 'Booking',
      entityId: bookingId,
      newValues: { bookingCode, totalVisitors: requestedCount, grandTotal, expiresAt },
      ip,
      userAgent,
    });

    return {
      bookingId,
      bookingCode,
      destinationName: destination.name,
      visitDate,
      totalVisitors: requestedCount,
      totalAmount: grandTotal,
      expiresAt,
      paymentCode,
      qrString,
    };
  });

  return executeBookingTx();
}

/**
 * Confirm and Settle Payment (Simulated Webhook / Gateway Callback)
 * Atomically transitions:
 * - Reservation: ACTIVE -> CONSUMED
 * - Quota: reserved_quota -> paid_quota
 * - Booking: RESERVED -> PAID
 * - Payment: PENDING -> SETTLED
 * - Tickets: ISSUED with HMAC dynamic salts
 */
export function confirmPaymentAndIssueTickets(bookingId, paymentMethod = 'QRIS', externalTxId = null) {
  const confirmTx = db.transaction(() => {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) throw new Error('Booking tidak ditemukan.');
    if (booking.status === 'PAID') {
      const existingTickets = db.prepare('SELECT ticket_code as ticketCode, visitor_name as visitorName, identity_number as identityNumber FROM tickets WHERE booking_id = ?').all(bookingId);
      return { alreadyPaid: true, bookingCode: booking.booking_code, issuedTickets: existingTickets };
    }

    const reservation = db.prepare('SELECT * FROM reservations WHERE booking_id = ?').get(bookingId);
    if (!reservation || reservation.status !== 'ACTIVE') {
      throw new Error('Sesi reservasi telah kedaluwarsa atau tidak valid.');
    }

    // 1. Move Quota: reserved_quota -> paid_quota
    db.prepare(`
      UPDATE quotas
      SET reserved_quota = MAX(0, reserved_quota - ?),
          paid_quota = paid_quota + ?,
          version = version + 1
      WHERE id = ?
    `).run(reservation.locked_slots, reservation.locked_slots, reservation.quota_id);

    // 2. Update Reservation
    db.prepare(`UPDATE reservations SET status = 'CONSUMED' WHERE id = ?`).run(reservation.id);

    // 3. Update Payment
    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare(`
      UPDATE payments
      SET status = 'SETTLED',
          payment_method = ?,
          external_transaction_id = ?,
          total_paid = amount,
          paid_at = ?
      WHERE booking_id = ?
    `).run(paymentMethod, externalTxId || 'TXN-' + Date.now(), nowIso, bookingId);

    // 4. Update Booking
    db.prepare(`UPDATE bookings SET status = 'PAID' WHERE id = ?`).run(bookingId);

    // 5. Issue Dynamic Tickets for each visitor
    const visitors = db.prepare('SELECT * FROM booking_visitors WHERE booking_id = ?').all(bookingId);
    const issuedTickets = [];

    const insertTicketStmt = db.prepare(`
      INSERT INTO tickets (
        id, ticket_code, booking_id, booking_visitor_id, destination_id, slot_id,
        visit_date, visitor_name, identity_number, entrance_gate, status,
        secret_token_salt, issued_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ISSUED', ?, ?, datetime('now'))
    `);

    for (const v of visitors) {
      const ticketId = 'tkt-' + crypto.randomUUID();
      const ticketCode = `TKT-${booking.visit_date.replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const salt = crypto.randomBytes(16).toString('hex');

      insertTicketStmt.run(
        ticketId, ticketCode, bookingId, v.id, booking.destination_id, booking.slot_id,
        booking.visit_date, v.full_name, v.identity_number, booking.entrance_gate, salt, nowIso
      );

      // Link ticket to visitor
      db.prepare('UPDATE booking_visitors SET ticket_id = ? WHERE id = ?').run(ticketId, v.id);

      issuedTickets.push({ ticketCode, visitorName: v.full_name, identityNumber: v.identity_number });
    }

    // 6. Notification
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, action_url, created_at)
      VALUES (?, ?, ?, ?, 'TICKET_ISSUED', ?, datetime('now'))
    `).run(
      'notif-' + crypto.randomUUID(),
      booking.user_id,
      'Tiket TNBTS Berhasil Terbit! 🎉',
      `Pembayaran pesanan ${booking.booking_code} telah diterima. ${issuedTickets.length} tiket digital aktif siap digunakan.`,
      `/tickets/${booking.booking_code}`
    );

    // 7. Audit Log
    logAudit({
      userId: booking.user_id,
      action: 'PAYMENT_SETTLED_TICKETS_ISSUED',
      entityType: 'Booking',
      entityId: bookingId,
      newValues: { bookingCode: booking.booking_code, ticketCount: issuedTickets.length, amount: booking.total_amount },
    });

    return { success: true, bookingCode: booking.booking_code, issuedTickets };
  });

  return confirmTx();
}
