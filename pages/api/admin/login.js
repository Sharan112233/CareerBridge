// pages/api/admin/login.js
import crypto from 'crypto';
import { getAdminSession } from '../../../lib/session';
import { rateLimit, getClientIp } from '../../../lib/rateLimit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  if (!rateLimit(`login:${ip}`, 5, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  }

  const { password } = req.body || {};
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return res.status(500).json({ error: 'Server not configured: ADMIN_PASSWORD missing.' });
  }
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Password required.' });
  }

  // True constant-time compare via Node crypto.
  // We hash both sides to a fixed length first, so the comparison itself
  // is independent of the original password length.
  const hashedInput = crypto.createHash('sha256').update(password).digest();
  const hashedExpected = crypto.createHash('sha256').update(expected).digest();
  const ok = crypto.timingSafeEqual(hashedInput, hashedExpected);

  if (!ok) {
    return res.status(401).json({ error: 'Invalid password.' });
  }

  const session = await getAdminSession(req, res);
  session.isAdmin = true;
  session.loginAt = Date.now();
  await session.save();

  return res.status(200).json({ ok: true });
}