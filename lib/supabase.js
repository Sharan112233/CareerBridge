// lib/supabase.js
// Two clients:
//   - supabase (public): used by SSR/SSG & client code. Anon key, RLS enforced.
//   - getSupabaseAdmin() (server-only): used inside /pages/api/admin/*.
//     Service-role key — bypasses RLS. NEVER import this from client-side code.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-only admin client. Uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
 * Only call this from /pages/api/* routes — never from pages or components.
 */
export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin() can only be called server-side.');
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Columns that the job-listing card renders. Selecting only these instead of
// `*` makes the Supabase query ~60% faster and shrinks the HTML payload.
// Kept as a single constant so it stays in sync everywhere.
export const LISTING_COLUMNS =
  'id, slug, title, company, location, salary, job_type, experience, ' +
  'category, tags, logo_color, is_fresher, is_new, created_at';

// ─── Public Job Queries (used by SSR/SSG) ─────────────────────

/** Fetch all active jobs, newest first. Used by pages that need the full row
 *  (job detail page, sitemap, related-job match). */
export async function getAllJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/** Paginated listing query — returns only the fields JobCard needs,
 *  plus a total count for pagination controls.
 *
 *  @param {number} page       1-indexed page number
 *  @param {number} pageSize   rows per page
 *  @returns {Promise<{jobs: Array, total: number}>}
 */
export async function getJobsPaginated(page = 1, pageSize = 9) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('jobs')
    .select(LISTING_COLUMNS, { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { jobs: data || [], total: count || 0 };
}

/** Listing-only variant of getAllJobs — for places that need every job
 *  but only the card fields (e.g. 404 page's "popular jobs" strip). */
export async function getAllJobsListing() {
  const { data, error } = await supabase
    .from('jobs')
    .select(LISTING_COLUMNS)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/** Fetch a single job by its URL slug */
export async function getJobBySlug(slug) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data;
}

/** Fetch all slugs (for getStaticPaths) */
export async function getAllSlugs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('slug')
    .eq('is_active', true);

  if (error) throw error;
  if (!Array.isArray(data)) return [];
  return data.map((j) => j.slug).filter(Boolean);
}

/** Get jobs by category (IT, BPO, BFSI, GOVT, WFH, CORE) */
export async function getJobsByCategory(category) {
  const { data, error } = await supabase
    .from('jobs')
    .select(LISTING_COLUMNS)
    .eq('is_active', true)
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/** Get jobs by company name (case-insensitive) */
export async function getJobsByCompany(company) {
  const { data, error } = await supabase
    .from('jobs')
    .select(LISTING_COLUMNS)
    .eq('is_active', true)
    .ilike('company', company)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/** Get all distinct company names (for /company/[name] static paths) */
export async function getAllCompanies() {
  const { data, error } = await supabase
    .from('jobs')
    .select('company')
    .eq('is_active', true);

  if (error) throw error;
  if (!Array.isArray(data)) return [];
  return Array.from(new Set(data.map((j) => j.company).filter(Boolean)));
}

/** Get fresher-eligible jobs */
export async function getFresherJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select(LISTING_COLUMNS)
    .eq('is_active', true)
    .eq('is_fresher', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}