// lib/session.js
import { getIronSession } from 'iron-session';

const secret = process.env.SESSION_SECRET;

if (!secret || secret.length < 32) {
  // Fail loudly at boot rather than silently using a weak fallback.
  // Generate one with:  openssl rand -base64 48
  throw new Error(
    'SESSION_SECRET must be set to a string of at least 32 characters. ' +
    'Add it to .env.local (and Vercel env vars).'
  );
}

export const sessionOptions = {
  password: secret,
  cookieName: 'careerbridge_admin_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

export function getAdminSession(req, res) {
  return getIronSession(req, res, sessionOptions);
}

export async function requireAdmin(req, res) {
  const session = await getAdminSession(req, res);
  if (!session.isAdmin) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return session;
}