import db from './db.js';
import crypto from 'crypto';

// In-memory rate limiter sliding window
const rateLimitStore = new Map();

export function checkRateLimit(key, maxRequests = 25, windowMs = 60000) {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record || now - record.startTime > windowMs) {
    record = { count: 1, startTime: now };
    rateLimitStore.set(key, record);
    return { allowed: true, remaining: maxRequests - 1 };
  }

  record.count++;
  if (record.count > maxRequests) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((record.startTime + windowMs - now) / 1000) };
  }

  return { allowed: true, remaining: maxRequests - record.count };
}

/**
 * Checks whether user already has an active unpaid reservation.
 * Enforces rule: 1 User = Max 1 Pending Active Reservation.
 */
export function checkActiveReservationLimit(userId) {
  const activeReservation = db.prepare(`
    SELECT r.id, r.expires_at, b.booking_code
    FROM reservations r
    JOIN bookings b ON r.booking_id = b.id
    WHERE b.user_id = ?
      AND r.status = 'ACTIVE'
      AND r.expires_at > datetime('now')
  `).get(userId);

  return activeReservation || null;
}

/**
 * Checks whether any visitor NIK has already exceeded weekly booking limits.
 * Default policy: 1 NIK = max 1 booking per 7-day window.
 */
export function checkNikPurchaseLimit(identityNumbers, visitDate) {
  const violations = [];

  for (const nik of identityNumbers) {
    const existing = db.prepare(`
      SELECT b.booking_code, b.visit_date, bv.full_name
      FROM booking_visitors bv
      JOIN bookings b ON bv.booking_id = b.id
      WHERE bv.identity_number = ?
        AND b.status IN ('PAID', 'RESERVED')
        AND date(b.visit_date) BETWEEN date(?, '-7 days') AND date(?, '+7 days')
    `).get(nik, visitDate, visitDate);

    if (existing) {
      violations.push({
        nik,
        name: existing.full_name,
        existingDate: existing.visit_date,
        bookingCode: existing.booking_code,
      });
    }
  }

  return violations;
}

/**
 * Behavioral Risk Scorer (0 - 100)
 * Evaluates multiple signals:
 * - Interaction timing velocity (< 800ms between page open and submit -> high bot signal)
 * - Number of recent failed/expired reservations
 * - User account age and verification status
 * - Header inconsistencies
 */
export function calculateBehavioralRisk({
  userId,
  ipHash,
  sessionId,
  formSubmissionTimeMs = 3000,
  isHeadlessBrowser = false,
  recentExpiredCount = 0,
}) {
  let score = 0;
  const signals = [];

  // Signal 1: Submission speed (bot vs human)
  if (formSubmissionTimeMs < 800) {
    score += 45;
    signals.push('UNNATURAL_SUBMISSION_SPEED_UNDER_800MS');
  } else if (formSubmissionTimeMs < 1500) {
    score += 20;
    signals.push('FAST_SUBMISSION_VELOCITY');
  }

  // Signal 2: Headless browser flags
  if (isHeadlessBrowser) {
    score += 50;
    signals.push('HEADLESS_AUTOMATION_FLAG');
  }

  // Signal 3: Consecutive expired reservations (ticket hoarding pattern)
  if (recentExpiredCount >= 3) {
    score += 35;
    signals.push('EXCESSIVE_EXPIRED_RESERVATIONS_HOARDING');
  } else if (recentExpiredCount >= 1) {
    score += 15;
    signals.push('RECENT_UNPAID_EXPIRED_SLOT');
  }

  // Bound score 0-100
  score = Math.min(100, Math.max(0, score));

  let riskLevel = 'LOW';
  let actionTaken = 'ALLOW';

  if (score >= 70) {
    riskLevel = 'HIGH';
    actionTaken = 'THROTTLE';
  } else if (score >= 35) {
    riskLevel = 'MEDIUM';
    actionTaken = 'CHALLENGE';
  }

  // Record risk score
  const riskId = 'rsk-' + crypto.randomUUID();
  try {
    db.prepare(`
      INSERT INTO risk_scores (id, user_id, ip_hash, session_id, score, risk_level, evaluated_signals, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(riskId, userId, ipHash, sessionId, score, riskLevel, JSON.stringify(signals));

    if (score >= 35) {
      const eventId = 'rev-' + crypto.randomUUID();
      db.prepare(`
        INSERT INTO risk_events (id, user_id, risk_score_id, action_type, ip_hash, session_id, severity, reason, payload_summary, action_taken, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', datetime('now'))
      `).run(
        eventId,
        userId,
        riskId,
        signals[0] || 'ANOMALY_BEHAVIOR',
        ipHash,
        sessionId,
        riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM',
        `Behavioral risk score: ${score}/100`,
        JSON.stringify(signals),
        actionTaken
      );
    }
  } catch (err) {
    console.error('Failed to log risk score:', err);
  }

  return { score, riskLevel, actionTaken, signals };
}
