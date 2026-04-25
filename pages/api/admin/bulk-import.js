// pages/api/admin/bulk-import.js
// POST { csv: "title,company,slug,..." }  → inserts all rows.
// Header row is required. Empty/malformed rows are skipped with per-row errors.

import { requireAdmin } from '../../../lib/session';
import { getSupabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { csv } = req.body || {};
  if (typeof csv !== 'string' || csv.trim().length === 0) {
    return res.status(400).json({ error: 'csv field required' });
  }

  const rows = parseCsv(csv);
  if (rows.length < 2) {
    return res.status(400).json({ error: 'CSV must have a header row + at least one data row.' });
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const dataRows = rows.slice(1);

  const jobs = [];
  const errors = [];

  dataRows.forEach((row, i) => {
    if (row.every((c) => c.trim() === '')) return; // skip blanks
    const obj = {};
    header.forEach((h, idx) => { obj[h] = (row[idx] ?? '').trim(); });

    if (!obj.title || !obj.company || !obj.apply_url) {
      errors.push({ row: i + 2, error: 'Missing title/company/apply_url' });
      return;
    }

    const autoSlug = slugify(`${obj.company}-${obj.title}`);
    jobs.push({
      title: obj.title,
      company: obj.company,
      slug: obj.slug || autoSlug,
      location: obj.location || '',
      job_type: obj.job_type || 'Full Time',
      experience: obj.experience || '',
      salary: obj.salary || '',
      salary_min: numOrNull(obj.salary_min),
      salary_max: numOrNull(obj.salary_max),
      salary_currency: obj.salary_currency || 'INR',
      description: obj.description || '',
      eligibility: obj.eligibility || '',
      responsibilities: splitList(obj.responsibilities),
      skills: splitList(obj.skills),
      tags: (obj.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      apply_url: obj.apply_url,
      last_date: obj.last_date || '',
      valid_through: parseDateOrNull(obj.valid_through),
      category: obj.category || 'IT',
      logo_color: obj.logo_color || '#2563EB',
      is_fresher: isTrue(obj.is_fresher),
      is_active: true,
    });
  });

  if (jobs.length === 0) {
    return res.status(400).json({ error: 'No valid rows.', errors });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('jobs')
    .upsert(jobs, { onConflict: 'slug' })
    .select();

  if (error) return res.status(500).json({ error: error.message, rowErrors: errors });
  return res.status(200).json({ inserted: data.length, rowErrors: errors });
}

// ─── Helpers (module-scope so they're hoisted predictably and easy to read) ───

// CSV parsing (RFC-4180: quoted fields, escaped double-quotes, CRLF)
function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } // escaped quote
        else { inQuotes = false; }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  // last field/row
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function numOrNull(v) {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function splitList(v) {
  if (!v) return [];
  // pipe-separated in CSV to avoid clashes with the comma delimiter
  return v.split('|').map((x) => x.trim()).filter(Boolean);
}

function isTrue(v) {
  return String(v).toLowerCase() === 'true' || v === '1' || String(v).toLowerCase() === 'yes';
}

// Parses any date-ish string into ISO-8601 or returns null on garbage input.
// Moved here from inside handler() — was previously placed mid-function which
// only worked due to JS function hoisting and would fail under strict block
// scoping rules in some environments.
function parseDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}