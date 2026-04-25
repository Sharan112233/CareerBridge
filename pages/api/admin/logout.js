// pages/api/admin/logout.js
import { getAdminSession } from '../../../lib/session';

export default async function handler(req, res) {
  const session = await getAdminSession(req, res);
  session.destroy();
  return res.status(200).json({ ok: true });
}
