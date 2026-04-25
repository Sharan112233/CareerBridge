// pages/api/admin/me.js
// Returns whether the current request is from an authenticated admin.
// Used by the admin page to know whether to show the login form or the panel.
import { getAdminSession } from '../../../lib/session';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Session lookup is cheap but session cookies are user-specific;
  // never cache this response.
  res.setHeader('Cache-Control', 'no-store');

  const session = await getAdminSession(req, res);
  return res.status(200).json({ isAdmin: Boolean(session.isAdmin) });
}