import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import { sendOtpEmail } from './mailer.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const randomCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, provider: user.provider }, JWT_SECRET, {
    expiresIn: '7d'
  });
}

export async function register(req, res) {
  const { email, password, displayName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'email already exists' });

  const hash = await bcrypt.hash(password, 10);
  const result = db
    .prepare('INSERT INTO users (email, password_hash, display_name, provider, verified) VALUES (?, ?, ?, ?, 1)')
    .run(email, hash, displayName || null, 'local');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ token: signToken(user), user });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !user.password_hash) return res.status(401).json({ error: 'invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'invalid credentials' });

  return res.json({ token: signToken(user), user });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.json({ ok: true });

  const code = randomCode();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  db.prepare('INSERT INTO otp_codes (user_id, code, purpose, expires_at) VALUES (?, ?, ?, ?)').run(
    user.id,
    code,
    'password-reset',
    expiresAt
  );

  await sendOtpEmail(user.email, code, 'password reset');
  return res.json({ ok: true });
}

export async function verifyOtpAndReset(req, res) {
  const { email, code, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(400).json({ error: 'invalid request' });

  const otp = db
    .prepare(
      `SELECT * FROM otp_codes
       WHERE user_id = ? AND code = ? AND purpose = 'password-reset' AND used = 0
       ORDER BY id DESC LIMIT 1`
    )
    .get(user.id, code);

  if (!otp || otp.expires_at < Date.now()) return res.status(400).json({ error: 'invalid or expired code' });

  const hash = await bcrypt.hash(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
  db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(otp.id);

  return res.json({ ok: true });
}
