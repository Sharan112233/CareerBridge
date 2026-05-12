// pages/index.js — Home page (ISR, SERVER-paginated, filter-persistent)
//
// FIX: previous version had a re-render loop where `setFetchingPage` triggered
// the same effect that started the fetch — causing the cleanup function to
// cancel the in-flight request before its data could land. Symptoms: the
// loader spun forever and Next/Prev "did nothing".
//
// Solution: track in-flight requests with a useRef (refs don't trigger
// re-renders) instead of state. Added an AbortController + 15s timeout so
// failed network requests surface as an error toast instead of hanging.

import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { getJobsPaginated } from '../lib/supabase';
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, CATEGORIES_UI } from '../lib/constants';
import Layout from '../components/Layout';
import Navbar from '../components/Navbar';
import JobCard from '../components/JobCard';
import AdBanner from '../components/AdBanner';
import Footer from '../components/Footer';
import Spinner from '../components/Spinner';
import styles from '../styles/Home.module.css';

const RecentlyViewedJobs = dynamic(
  () => import('../components/RecentlyViewedJobs'),
  { ssr: false, loading: () => null }
);

const PAGE_SIZE = 9;
const FETCH_TIMEOUT_MS = 15000; // surface a failure after 15s instead of spinning forever

export default function Home({ initialJobs, totalJobs, companyCount }) {
  const router = useRouter();

  const [filter, setFilter] = React.useState('All');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [loadedPages, setLoadedPages] = React.useState({ 1: initialJobs });
  const [filteredCache, setFilteredCache] = React.useState({});

  // Render-only flag: just used to show/hide the spinner.
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState(null);

  const [hydrated, setHydrated] = React.useState(false);
  const listTopRef = React.useRef(null);

  // Track which page is currently being fetched in a REF — refs don't cause
  // re-renders, so the effect doesn't see itself update.
  const inFlightPageRef = React.useRef(null);
  const inFlightFilterRef = React.useRef(null);

  const totalPages = Math.max(1, Math.ceil(totalJobs / PAGE_SIZE));

  // Hydrate state from URL + localStorage
  React.useEffect(() => {
    if (!router.isReady) return;
    const { filter: qF, search: qS, page: qP } = router.query;

    let nextFilter = 'All';
    if (typeof qF === 'string' && CATEGORIES_UI.includes(qF)) {
      nextFilter = qF;
    } else {
      try {
        const saved = localStorage.getItem('cb_filter');
        if (saved && CATEGORIES_UI.includes(saved)) nextFilter = saved;
      } catch {}
    }

    let nextSearch = '';
    if (typeof qS === 'string') nextSearch = qS;

    let nextPage = 1;
    if (typeof qP === 'string') {
      const p = parseInt(qP, 10);
      if (Number.isFinite(p) && p > 0) nextPage = p;
    }

    try { localStorage.removeItem('cb_search'); } catch {}

    setFilter(nextFilter);
    setSearch(nextSearch);
    setPage(nextPage);
    setHydrated(true);
  }, [router.isReady, router.query]);

  React.useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem('cb_filter', filter); } catch {}
  }, [filter, hydrated]);

  // Fetch filtered jobs when filter changes
  React.useEffect(() => {
    if (!hydrated) return;
    if (filter === 'All') {
      // No need to fetch, use regular pagination
      return;
    }
    
    // Check if we already have this filter cached
    if (filteredCache[filter]) {
      return;
    }

    // Check if already fetching this filter
    if (inFlightFilterRef.current === filter) {
      return;
    }

    inFlightFilterRef.current = filter;
    setIsLoading(true);
    setLoadError(null);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort('timeout'), FETCH_TIMEOUT_MS);

    let cancelled = false;

    // Fetch all jobs for this filter
    let apiUrl = '/api/jobs?pageSize=1000'; // Get all jobs
    if (filter === 'IT Jobs') {
      apiUrl += '&category=IT';
    } else if (filter === 'BPO Jobs') {
      apiUrl += '&category=BPO';
    } else if (filter === 'Fresher') {
      apiUrl += '&fresher=true';
    }

    fetch(apiUrl, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setFilteredCache((prev) => ({ ...prev, [filter]: data.jobs || [] }));
        setLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.name === 'AbortError') {
          setLoadError('Request timed out. Please check your connection and try again.');
        } else {
          setLoadError('Failed to load jobs. Please try again.');
        }
      })
      .finally(() => {
        if (cancelled) return;
        clearTimeout(timer);
        inFlightFilterRef.current = null;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort('superseded');
    };
  }, [filter, filteredCache, hydrated]);

  // Fetch missing pages on demand for 'All' filter
  React.useEffect(() => {
    if (!hydrated) return;
    if (filter !== 'All') return; // Only fetch pages when filter is 'All'
    if (loadedPages[page]) {
      // We already have this page — nothing to do
      setIsLoading(false);
      setLoadError(null);
      return;
    }
    if (inFlightPageRef.current === page) {
      // Already fetching this exact page — don't fire a duplicate request
      return;
    }

    inFlightPageRef.current = page;
    setIsLoading(true);
    setLoadError(null);

    // Timeout via AbortController — without this, a stalled network request
    // can hang forever, which is what was causing "loading for 5 minutes".
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort('timeout'), FETCH_TIMEOUT_MS);

    let cancelled = false;

    fetch(`/api/jobs?page=${page}&pageSize=${PAGE_SIZE}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setLoadedPages((prev) => ({ ...prev, [page]: data.jobs || [] }));
        setLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.name === 'AbortError') {
          setLoadError('Request timed out. Please check your connection and try again.');
        } else {
          setLoadError('Failed to load jobs. Please try again.');
        }
      })
      .finally(() => {
        if (cancelled) return;
        clearTimeout(timer);
        inFlightPageRef.current = null;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      // Abort the in-flight request when this effect cleans up (e.g. user
      // navigated to a different page). Don't reset inFlightPageRef here —
      // .finally() handles that, and we want it to stay set so a duplicate
      // fetch isn't fired before the abort propagates.
      controller.abort('superseded');
    };
  }, [page, loadedPages, hydrated, filter]);

  // Get the current jobs based on filter
  const allFilteredJobs = React.useMemo(() => {
    if (filter === 'All') {
      return loadedPages[page] || [];
    } else {
      return filteredCache[filter] || [];
    }
  }, [filter, loadedPages, page, filteredCache]);

  // Apply search on top of filtered jobs
  const displayJobs = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allFilteredJobs;
    
    return allFilteredJobs.filter((j) => {
      return (
        (j.title || '').toLowerCase().includes(q) ||
        (j.company || '').toLowerCase().includes(q) ||
        (j.location || '').toLowerCase().includes(q) ||
        (j.tags || []).some((t) => (t || '').toLowerCase().includes(q))
      );
    });
  }, [allFilteredJobs, search]);

  // Paginate filtered jobs
  const filteredTotalPages = filter !== 'All' 
    ? Math.ceil(displayJobs.length / PAGE_SIZE)
    : totalPages;
  
  const currentPageJobs = filter !== 'All'
    ? displayJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : displayJobs;

  React.useEffect(() => {
    if (!hydrated) return;
    setPage(1);
    // Clear filtered cache when search changes
    if (search) {
      setFilteredCache({});
    }
    // Scroll to job results when user searches
    if (search && listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [filter, search, hydrated]);

  const goToPage = (p) => {
    const maxPages = filter !== 'All' ? filteredTotalPages : totalPages;
    if (p < 1 || p > maxPages) return;
    setPage(p);
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const retryCurrentPage = () => {
    // Clear error and force the effect to re-run
    if (filter === 'All') {
      setLoadedPages((prev) => {
        const copy = { ...prev };
        delete copy[page];
        return copy;
      });
    } else {
      setFilteredCache((prev) => {
        const copy = { ...prev };
        delete copy[filter];
        return copy;
      });
    }
  };

  const activeTotalPages = filter !== 'All' ? filteredTotalPages : totalPages;

  return (
    <Layout>
      <Head>
        <title>{`${SITE_NAME} – ${SITE_DESCRIPTION}`}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${SITE_NAME} – ${SITE_DESCRIPTION}`} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <link rel="canonical" href={SITE_URL} />
      </Head>

      <Navbar search={search} onSearch={setSearch} />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Find Your Dream Job Today
            </h1>
            <p className={styles.heroSub}>
              Browse job openings from TCS, Infosys, Wipro, Accenture, and 50+ companies. We update listings every day. Apply directly on the official company website — 100% free, no signup needed.
            </p>
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <div className={styles.statIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statNum}>{String(totalJobs ?? 0)}+</span>
                  <span className={styles.statLabel}>Active Jobs</span>
                </div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statNum}>{String(companyCount ?? 0)}+</span>
                  <span className={styles.statLabel}>Companies</span>
                </div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 2v20M21 12H3M16 4.586A7.002 7.002 0 0119.414 8M4.586 16A7.002 7.002 0 018 19.414"/>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statNum}>Daily</span>
                  <span className={styles.statLabel}>Updates</span>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.heroIllustration}>
            <svg width="500" height="400" viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Browser Window */}
              <rect x="50" y="40" width="280" height="200" rx="12" fill="var(--bg-elevated)" stroke="var(--border)" strokeWidth="2"/>
              <rect x="50" y="40" width="280" height="30" rx="12" fill="var(--bg-muted)"/>
              <circle cx="68" cy="55" r="4" fill="#DC2626"/>
              <circle cx="82" cy="55" r="4" fill="#FBBF24"/>
              <circle cx="96" cy="55" r="4" fill="#16A34A"/>
              {/* Browser content */}
              <circle cx="90" cy="100" r="8" fill="var(--text-soft)" opacity="0.3"/>
              <rect x="110" y="92" width="180" height="8" rx="4" fill="var(--text-soft)" opacity="0.3"/>
              <rect x="110" y="105" width="120" height="6" rx="3" fill="var(--bg-muted)"/>
              <circle cx="90" cy="140" r="8" fill="var(--text-soft)" opacity="0.3"/>
              <rect x="110" y="132" width="180" height="8" rx="4" fill="var(--text-soft)" opacity="0.3"/>
              <rect x="110" y="145" width="140" height="6" rx="3" fill="var(--bg-muted)"/>
              <circle cx="90" cy="180" r="8" fill="var(--text-soft)" opacity="0.3"/>
              <rect x="110" y="172" width="180" height="8" rx="4" fill="var(--text-soft)" opacity="0.3"/>
              <rect x="110" y="185" width="100" height="6" rx="3" fill="var(--bg-muted)"/>
              {/* Person sitting */}
              <ellipse cx="400" cy="360" rx="60" ry="12" fill="var(--text-soft)" opacity="0.2"/>
              {/* Chair */}
              <path d="M350 280 L350 360 M370 280 L370 360 M340 360 L380 360 M340 280 L380 280 Q390 260 390 240 L390 200 M340 200 L390 200" stroke="var(--text)" strokeWidth="3" fill="none"/>
              {/* Person body */}
              <circle cx="380" cy="160" r="22" fill="#FEE2E2" stroke="var(--text)" strokeWidth="2"/>
              <path d="M380 182 L380 250" stroke="var(--text)" strokeWidth="3"/>
              <path d="M380 200 L350 230" stroke="var(--text)" strokeWidth="3"/>
              <path d="M380 200 L410 220" stroke="var(--text)" strokeWidth="3"/>
              <path d="M380 250 L360 300" stroke="var(--text)" strokeWidth="3"/>
              <path d="M380 250 L400 300" stroke="var(--text)" strokeWidth="3"/>
              {/* Laptop */}
              <rect x="370" y="215" width="60" height="40" rx="2" fill="#1F2937" stroke="var(--text)" strokeWidth="2"/>
              <rect x="365" y="255" width="70" height="3" fill="#374151"/>
              {/* Plant */}
              <ellipse cx="120" cy="300" rx="20" ry="8" fill="var(--text-soft)" opacity="0.3"/>
              <path d="M120 300 L120 270 M115 280 Q110 275 108 270 M125 280 Q130 275 132 270 M115 285 Q108 282 105 278 M125 285 Q132 282 135 278" stroke="#16A34A" strokeWidth="2" fill="none"/>
            </svg>
          </div>
        </div>
      </section>

      <div className={styles.adWrap}>
        <AdBanner slot="leaderboard" />
      </div>

      <main className={styles.main}>
        <RecentlyViewedJobs />

        <div ref={listTopRef} className={styles.sectionTop}>
          <h2 className={styles.sectionTitle}>Latest Job Openings</h2>
          <div className={styles.filters}>
            {CATEGORIES_UI.map((c) => (
              <button
                key={c}
                className={`${styles.filterBtn} ${filter === c ? styles.filterActive : ''}`}
                onClick={() => setFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <Spinner size="large" label={filter !== 'All' ? `Loading ${filter}...` : `Loading page ${page}…`} />
        ) : loadError ? (
          <div className={styles.empty}>
            <p style={{ marginBottom: 12 }}>{loadError}</p>
            <button
              type="button"
              onClick={retryCurrentPage}
              className={styles.filterBtn}
              style={{ padding: '8px 18px' }}
            >
              Try again
            </button>
          </div>
        ) : currentPageJobs.length === 0 ? (
          <div className={styles.empty}>
            {search || filter !== 'All'
              ? 'No jobs match your filters. Try different criteria.'
              : 'No jobs found.'}
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {currentPageJobs.slice(0, 3).map((j) => <JobCard key={j.id} job={j} />)}
            </div>
            <div className={styles.adMid}><AdBanner slot="large" /></div>
            <div className={styles.grid}>
              {currentPageJobs.slice(3).map((j) => <JobCard key={j.id} job={j} />)}
            </div>
          </>
        )}

        {!isLoading && activeTotalPages > 1 && (
          <>
            <nav className={styles.pagination} aria-label="Pagination">
              <button
                className={styles.pageBtn}
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
              >
                ← Prev
              </button>
              {Array.from({ length: activeTotalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === activeTotalPages || Math.abs(p - page) <= 1)
                .map((p, i, arr) => (
                  <React.Fragment key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: 'var(--text-faint)' }}>…</span>}
                    <button
                      className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                      onClick={() => goToPage(p)}
                      aria-current={p === page ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button
                className={styles.pageBtn}
                onClick={() => goToPage(page + 1)}
                disabled={page === activeTotalPages}
              >
                Next →
              </button>
            </nav>

            <div className={styles.pageStatus} aria-live="polite">
              Page {page} of {activeTotalPages} · Showing {currentPageJobs.length} jobs
              {filter !== 'All' && ` · ${displayJobs.length} total ${filter}`}
            </div>
          </>
        )}

        <div className={styles.adBottom}><AdBanner slot="rectangle" /></div>
      </main>

      <section className={styles.waCta}>
        <div className={styles.waCtaInner}>
          <div>
            <h3 className={styles.waTitle}>📲 Get Job Alerts on WhatsApp</h3>
            <p className={styles.waSub}>Join our channel — get notified instantly when new jobs are posted.</p>
          </div>
          <a href={process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || '#'} className={styles.waBtn} target="_blank" rel="noopener noreferrer">
            Join WhatsApp Channel →
          </a>
        </div>
      </section>

      <Footer />
    </Layout>
  );
}

export async function getStaticProps() {
  try {
    // We need three things from the DB at build time:
    //   1. Page 1 jobs (for the listing)
    //   2. Total active job count (for pagination + hero stat)
    //   3. Distinct company count (for hero stat)
    //
    // Importing getAllCompanies inside the function keeps the bundle tree-shake
    // clean — getAllCompanies is only used here on the server.
    const { getAllCompanies } = await import('../lib/supabase');

    const [{ jobs, total }, companies] = await Promise.all([
      getJobsPaginated(1, PAGE_SIZE),
      getAllCompanies(),
    ]);

    return {
      props: {
        initialJobs: jobs,
        totalJobs: total,
        companyCount: Array.isArray(companies) ? companies.length : 0,
      },
      revalidate: 60,
    };
  } catch (err) {
    return {
      props: { initialJobs: [], totalJobs: 0, companyCount: 0 },
      revalidate: 30,
    };
  }
}