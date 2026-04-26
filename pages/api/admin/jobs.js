// pages/api/admin/jobs.js
// All job mutations go through here — uses service-role key server-side.
// Admin-only via iron-session cookie.

import { requireAdmin } from '../../../lib/session';
import { getSupabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return; // requireAdmin already sent 401

  const admin = getSupabaseAdmin();

  if (req.method === 'GET') {
    const { data, error } = await admin
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ jobs: data });
  }

  if (req.method === 'POST') {
    const payload = sanitizeJobPayload(req.body);
    if (!payload.title || !payload.company || !payload.apply_url || !payload.slug) {
      return res.status(400).json({ error: 'title, company, slug, and apply_url are required.' });
    }
    const { data, error } = await admin.from('jobs').insert([payload]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ job: data });
  }

  if (req.method === 'PUT') {
    const { id, ...rest } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    const payload = sanitizeJobPayload(rest);
    const { data, error } = await admin
      .from('jobs')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ job: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    // HARD DELETE — row is removed from the database permanently.
    // No soft-delete flag, no recovery. The admin UI shows a toast on success.
    const { error } = await admin.from('jobs').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}

function sanitizeJobPayload(body = {}) {
  const toNumOrNull = (v) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const toArr = (v) =>
    Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n').map((x) => x.trim()).filter(Boolean) : [];
  const toTagArr = (v) =>
    Array.isArray(v) ? v : typeof v === 'string' ? v.split(',').map((x) => x.trim()).filter(Boolean) : [];

  // Only whitelisted fields are written to the DB
  return {
    title: String(body.title || '').trim(),
    company: String(body.company || '').trim(),
    slug: String(body.slug || '').trim().toLowerCase(),
    location: String(body.location || '').trim(),
    job_type: String(body.job_type || 'Full Time').trim(),
    experience: String(body.experience || '').trim(),
    salary: String(body.salary || '').trim(),
    salary_min: toNumOrNull(body.salary_min),
    salary_max: toNumOrNull(body.salary_max),
    salary_currency: String(body.salary_currency || 'INR').trim(),
  description: String(body.description || '').trim(),
    seo_title: String(body.seo_title || '').trim(),
    eligibility: String(body.eligibility || '').trim(),
    responsibilities: toArr(body.responsibilities),
    skills: toArr(body.skills),
    tags: toTagArr(body.tags),
    apply_url: String(body.apply_url || '').trim(),
    last_date: String(body.last_date || '').trim(),
    valid_through: parseDateOrNull(body.valid_through),
    category: String(body.category || 'IT').trim(),
    logo_color: String(body.logo_color || '#2563EB').trim(),
    is_fresher: Boolean(body.is_fresher),
    is_active: body.is_active === undefined ? true : Boolean(body.is_active),
  };
}
function parseDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}