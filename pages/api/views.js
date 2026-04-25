// pages/api/views.js
// Public endpoint to bump a job's view count.
// Rate-limited to prevent abuse: 1 increment per IP per job per hour.

import { getSupabaseAdmin } from '../../lib/supabase';
import { rateLimit, getClientIp } from '../../lib/rateLimit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.body || {};
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'id required' });
  }
  // basic UUID shape check
  if (!/^[0-9a-f-]{10,}$/i.test(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const ip = getClientIp(req);
  // 1 hit per (ip, job) per hour
  if (!rateLimit(`view:${ip}:${id}`, 1, 60 * 60 * 1000)) {
    return res.status(200).json({ ok: true, deduped: true });
  }

  try {
    const admin = getSupabaseAdmin();
    await admin.rpc('increment_views', { job_id: id });
  } catch (e) {
    // view counts are a vanity metric — fail quietly
  }
  return res.status(200).json({ ok: true });
}
