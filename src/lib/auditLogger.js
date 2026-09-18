import db from './db.js';
import crypto from 'crypto';

export function logAudit({
  userId = null,
  userEmail = null,
  action,
  entityType = null,
  entityId = null,
  oldValues = null,
  newValues = null,
  ip = null,
  userAgent = null,
}) {
  try {
    const id = 'aud-' + crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      id,
      userId,
      userEmail,
      action,
      entityType,
      entityId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ip,
      userAgent
    );
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}
