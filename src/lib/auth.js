import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tnbts-super-secure-jwt-secret-key-2026';

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.primary_role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function authenticateUser(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return null;
  if (!user.is_active) return { error: 'Akun Anda sedang dinonaktifkan.' };

  const valid = comparePassword(password, user.password);
  if (!valid) return null;

  // Update last login
  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);

  const token = generateToken(user);
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.primary_role,
      isVerified: Boolean(user.is_verified),
      riskScore: user.risk_score,
    },
    token,
  };
}

export function getCurrentUser(request) {
  const authHeader = request.headers.get('authorization');
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Check cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/tnbts_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = db.prepare('SELECT id, name, email, phone, primary_role, is_active, is_verified, risk_score FROM users WHERE id = ?').get(decoded.id);
  if (!user || !user.is_active) return null;

  return user;
}
