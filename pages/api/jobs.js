// pages/api/jobs.js
// Paginated job listing API — used by the home page's client-side pagination.

import { getJobsPaginated, supabase, LISTING_COLUMNS } from '../../lib/supabase';
import { rateLimit } from '../../lib/rateLimit';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await rateLimit(req, res);
  } catch {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 9;
    const category = req.query.category; // 'IT' or 'BPO'
    const fresher = req.query.fresher === 'true';

    // If category or fresher filter is specified, fetch filtered jobs
    if (category || fresher) {
      let query = supabase
        .from('jobs')
        .select(LISTING_COLUMNS, { count: 'exact' })
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      if (fresher) {
        query = query.eq('is_fresher', true);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return res.status(200).json({
        jobs: data || [],
        total: count || 0,
      });
    }

    // Default: paginated all jobs
    const { jobs, total } = await getJobsPaginated(page, pageSize);
    return res.status(200).json({ jobs, total });
  } catch (err) {
    console.error('API /jobs error:', err);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
}