// pages/api/admin/bulk-import.js
//
// POST { csv: "title,company,apply_url,..." }  → upsert all rows by slug.
// Header row required. Empty/malformed rows skipped with per-row errors.
//
// What this importer does for you (so you don't have to be perfect):
//   - Normalizes `category`:   "BPO Jobs" → "BPO", "it" → "IT", etc.
//   - Normalizes `job_type`:   "Full-time" → "Full Time"
//   - Builds `salary` display: from salary_min/salary_max if you didn't provide it
//   - Auto-generates `slug`:   from company + title if you didn't provide one
//   - Splits responsibilities/skills on `|` (pipe) since CSV uses commas
//
// Why pipe (|) for list fields? CSVs use comma as a delimiter — listing
// "Java, Python, Go" inside one cell would break the row. Use:
//     "Java|Python|Go"
// and the importer turns that into a proper array.

import { requireAdmin } from '../../../lib/session';
import { getSupabaseAdmin } from '../../../lib/supabase';

// ─── Field-value normalization tables ──────────────────────────

// DB stores categories as short codes. Accept many spellings → map to code.
// Anything not matched falls through to 'IT' (the safe default).
const CATEGORY_ALIASES = {
  'it': 'IT', 'it jobs': 'IT', 'information technology': 'IT', 'software': 'IT', 'tech': 'IT',
  'bpo': 'BPO', 'bpo jobs': 'BPO', 'voice': 'BPO', 'customer support': 'BPO', 'kpo': 'BPO',
  'bfsi': 'BFSI', 'bfsi jobs': 'BFSI', 'banking': 'BFSI', 'finance': 'BFSI', 'banking and finance': 'BFSI', 'banking & finance': 'BFSI', 'banking & finance jobs': 'BFSI',
  'core': 'CORE', 'core jobs': 'CORE', 'core engineering': 'CORE', 'mechanical': 'CORE', 'civil': 'CORE', 'electrical': 'CORE',
};
const VALID_CATEGORIES = new Set(['IT', 'BPO', 'BFSI', 'CORE']);

// Common job_type variants → canonical label (matches the dropdown in the form).
const JOB_TYPE_ALIASES = {
  'full time': 'Full Time', 'full-time': 'Full Time', 'fulltime': 'Full Time', 'ft': 'Full Time',
  'part time': 'Part Time', 'part-time': 'Part Time', 'parttime': 'Part Time', 'pt': 'Part Time',
  'contract': 'Contract', 'contractor': 'Contract', 'temporary': 'Contract', 'temp': 'Contract',
  'internship': 'Internship', 'intern': 'Internship',
};

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
  const rowErrors = [];   // Hard errors — row was skipped
  const rowWarnings = []; // Soft warnings — row was imported but with normalized values

  dataRows.forEach((row, i) => {
    const rowNum = i + 2; // +2 because: arrays 0-indexed AND we skipped the header

    // Skip totally blank rows (common when CSV has trailing newline)
    if (row.every((c) => c.trim() === '')) return;

    const obj = {};
    header.forEach((h, idx) => { obj[h] = (row[idx] ?? '').trim(); });

    // ─── Required fields ────────────────────────────────────
    if (!obj.title || !obj.company || !obj.apply_url) {
      rowErrors.push({ row: rowNum, error: 'Missing required field (title, company, or apply_url)' });
      return;
    }

    // ─── Normalize category ────────────────────────────────
    let category = (obj.category || '').trim();
    if (category) {
      const aliasMatch = CATEGORY_ALIASES[category.toLowerCase()];
      if (aliasMatch) {
        if (aliasMatch !== category) {
          rowWarnings.push({ row: rowNum, warning: `Category "${category}" → "${aliasMatch}"` });
        }
        category = aliasMatch;
      } else if (VALID_CATEGORIES.has(category.toUpperCase())) {
        category = category.toUpperCase();
      } else {
        rowWarnings.push({ row: rowNum, warning: `Unknown category "${category}", defaulted to "IT"` });
        category = 'IT';
      }
    } else {
      category = 'IT';
    }

    // ─── Normalize job_type ────────────────────────────────
    let jobType = (obj.job_type || '').trim();
    if (jobType) {
      const alias = JOB_TYPE_ALIASES[jobType.toLowerCase()];
      if (alias) {
        if (alias !== jobType) {
          rowWarnings.push({ row: rowNum, warning: `Job type "${jobType}" → "${alias}"` });
        }
        jobType = alias;
      }
      // If no alias matched, keep user's value (admin form has no DB constraint)
    } else {
      jobType = 'Full Time';
    }

    // ─── Build salary display text if not provided ─────────
    // Cards show `salary` (string), not the numeric min/max. So if admin gave
    // numbers but no display string, build something sensible.
    let salaryDisplay = obj.salary || '';
    const sMin = numOrNull(obj.salary_min);
    const sMax = numOrNull(obj.salary_max);
    const currency = (obj.salary_currency || 'INR').toUpperCase();
    if (!salaryDisplay && (sMin || sMax)) {
      salaryDisplay = formatSalaryDisplay(sMin, sMax, currency);
      rowWarnings.push({ row: rowNum, warning: `salary auto-built: "${salaryDisplay}"` });
    }

    const autoSlug = slugify(`${obj.company}-${obj.title}`);
    jobs.push({
      title: obj.title,
      company: obj.company,
      slug: obj.slug || autoSlug,
      location: obj.location || '',
      job_type: jobType,
      experience: obj.experience || '',
      salary: salaryDisplay,
      salary_min: sMin,
      salary_max: sMax,
      salary_currency: currency,
      description: obj.description || '',
      seo_title: obj.seo_title || '',
      eligibility: obj.eligibility || '',
      responsibilities: splitList(obj.responsibilities),
      skills: splitList(obj.skills),
      tags: (obj.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      apply_url: obj.apply_url,
      last_date: obj.last_date || '',
      valid_through: parseDateOrNull(obj.valid_through),
      category,
      logo_color: obj.logo_color || '#2563EB',
      is_fresher: isTrue(obj.is_fresher),
      is_active: true,
    });
  });

  if (jobs.length === 0) {
    return res.status(400).json({
      error: 'No valid rows were found. Check the row errors below.',
      rowErrors,
      rowWarnings,
    });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('jobs')
    .upsert(jobs, { onConflict: 'slug' })
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message,
      rowErrors,
      rowWarnings,
    });
  }

  return res.status(200).json({
    inserted: data.length,
    rowErrors,
    rowWarnings,
  });
}

// ─── Helpers (module-scope) ─────────────────────────────────────

// Format salary_min/max into a human display string.
// 250000, 350000, INR  →  "₹2.5 – 3.5 LPA"
// 60000, 80000, USD    →  "$60K – $80K / year"
function formatSalaryDisplay(min, max, currency) {
  if (currency === 'INR') {
    // Format LPA without the ₹ symbol — we add it once at the start
    const fmt = (n) => {
      if (!n) return '';
      const lpa = n / 100000;
      return lpa % 1 === 0 ? String(lpa) : lpa.toFixed(1);
    };
    if (min && max) return `₹${fmt(min)} – ${fmt(max)} LPA`;
    if (min)        return `₹${fmt(min)} LPA+`;
    if (max)        return `Up to ₹${fmt(max)} LPA`;
    return '';
  }
  // Generic non-INR formatting
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency + ' ';
  const fmt = (n) => `${sym}${n >= 1000 ? Math.round(n / 1000) + 'K' : n}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)} / year`;
  if (min)        return `${fmt(min)}+ / year`;
  if (max)        return `Up to ${fmt(max)} / year`;
  return '';
}

// CSV parsing (RFC-4180 lite: quoted fields, escaped double-quotes, CRLF)
function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\r') { /* ignore */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function numOrNull(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function splitList(v) {
  if (!v) return [];
  return v.split('|').map((x) => x.trim()).filter(Boolean);
}

function isTrue(v) {
  const s = String(v).toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y';
}

// Accepts "2026-05-31", "May 31, 2026", ISO datetimes, etc.
function parseDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}