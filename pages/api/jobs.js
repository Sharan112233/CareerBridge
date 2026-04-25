// pages/api/jobs.js
// Public paginated jobs endpoint. Used by the home page to load pages 2+
// without shipping all jobs in the initial HTML.
//
// GET /api/jobs?page=2&pageSize=9
//   → { jobs: [...], total: 123, page: 2, pageSize: 9 }

import { getJobsPaginated } from '../../lib/supabase';

const MAX_PAGE_SIZE = 50;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse & validate query params
  const pageNum = parseInt(req.query.page, 10);
  const sizeNum = parseInt(req.query.pageSize, 10);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
  const pageSize = Number.isFinite(sizeNum) && sizeNum > 0 && sizeNum <= MAX_PAGE_SIZE
    ? sizeNum
    : 9;

  try {
    const { jobs, total } = await getJobsPaginated(page, pageSize);

    // Cache at the edge for 60s, allow stale for 5 min while revalidating.
    // On Vercel this hits their CDN, so most requests never touch Supabase.
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );

    return res.status(200).json({ jobs, total, page, pageSize });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
}