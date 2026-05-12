// pages/index.js — Home page (ISR, SERVER-paginated, filter-persistent)

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
const FETCH_TIMEOUT_MS = 15000;

export default function Home({ initialJobs, totalJobs, companyCount }) {
  const router = useRouter();

  const [filter, setFilter] = React.useState('All');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [loadedPages, setLoadedPages] = React.useState({ 1: initialJobs });
  const [filteredCache, setFilteredCache] = React.useState({});
  const [allJobsCache, setAllJobsCache] = React.useState(null);
  const [searchResults, setSearchResults] = React.useState(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState(null);

  const [hydrated, setHydrated] = React.useState(false);
  const listTopRef = React.useRef(null);

  const inFlightPageRef = React.useRef(null);
  const inFlightFilterRef = React.useRef(null);
  const inFlightSearchRef = React.useRef(null);

  const totalPages = Math.max(1, Math.ceil(totalJobs / PAGE_SIZE));

  // Reset filter to 'All' when component mounts (homepage visit)
  React.useEffect(() => {
    setFilter('All');
    setSearch('');
    setPage(1);
    setSearchResults(null);
    setFilteredCache({});
    setHydrated(true);
  }, []);

  // Fetch all jobs for search functionality
  React.useEffect(() => {
    if (!hydrated) return;
    if (allJobsCache) return; // Already loaded

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort('timeout'), FETCH_TIMEOUT_MS);

    fetch('/api/jobs?pageSize=10000', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setAllJobsCache(data.jobs || []);
      })
      .catch((err) => {
        console.error('Failed to load all jobs for search:', err);
      })
      .finally(() => {
        clearTimeout(timer);
      });

    return () => {
      clearTimeout(timer);
      controller.abort('superseded');
    };
  }, [hydrated, allJobsCache]);

  // Handle search - search across all jobs
  React.useEffect(() => {
    if (!hydrated) return;
    
    const q = search.trim().toLowerCase();
    
    if (!q) {
      setSearchResults(null);
      return;
    }

    // If we don't have all jobs yet, wait
    if (!allJobsCache) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);

    // Search across all jobs
    setTimeout(() => {
      const results = allJobsCache.filter((j) => {
        const matchSearch =
          (j.title || '').toLowerCase().includes(q) ||
          (j.company || '').toLowerCase().includes(q) ||
          (j.location || '').toLowerCase().includes(q) ||
          (j.tags || []).some((t) => (t || '').toLowerCase().includes(q));
        
        // Apply current filter on search results
        const matchFilter =
          filter === 'All' ? true :
          filter === 'IT Jobs' ? j.category === 'IT' :
          filter === 'BPO Jobs' ? j.category === 'BPO' :
          filter === 'Fresher' ? Boolean(j.is_fresher) : true;
        
        return matchSearch && matchFilter;
      });

      setSearchResults(results);
      setPage(1);
      setIsLoading(false);
    }, 100);
  }, [search, allJobsCache, filter, hydrated]);

  // Fetch filtered jobs when filter changes
  React.useEffect(() => {
    if (!hydrated) return;
    if (filter === 'All') {
      return;
    }
    
    if (filteredCache[filter]) {
      return;
    }

    if (inFlightFilterRef.current === filter) {
      return;
    }

    inFlightFilterRef.current = filter;
    setIsLoading(true);
    setLoadError(null);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort('timeout'), FETCH_TIMEOUT_MS);

    let cancelled = false;

    let apiUrl = '/api/jobs?pageSize=1000';
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
    if (filter !== 'All') return;
    if (search) return; // Don't fetch pages when searching
    if (loadedPages[page]) {
      setIsLoading(false);
      setLoadError(null);
      return;
    }
    if (inFlightPageRef.current === page) {
      return;
    }

    inFlightPageRef.current = page;
    setIsLoading(true);
    setLoadError(null);

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
      controller.abort('superseded');
    };
  }, [page, loadedPages, hydrated, filter, search]);

  // Get the current jobs based on filter and search
  const allFilteredJobs = React.useMemo(() => {
    // If searching, return search results
    if (search && searchResults) {
      return searchResults;
    }

    // If filter is active, return filtered cache
    if (filter !== 'All') {
      return filteredCache[filter] || [];
    }

    // Default: return current page jobs
    return loadedPages[page] || [];
  }, [filter, loadedPages, page, filteredCache, search, searchResults]);

  // Paginate the jobs
  const filteredTotalPages = (search && searchResults) || filter !== 'All'
    ? Math.ceil(allFilteredJobs.length / PAGE_SIZE)
    : totalPages;
  
  const currentPageJobs = (search && searchResults) || filter !== 'All'
    ? allFilteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : allFilteredJobs;

  // Reset page when filter or search changes
  React.useEffect(() => {
    if (!hydrated) return;
    setPage(1);
    if ((search || filter !== 'All') && listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [filter, search, hydrated]);

  const goToPage = (p) => {
    const maxPages = (search && searchResults) || filter !== 'All' ? filteredTotalPages : totalPages;
    if (p < 1 || p > maxPages) return;
    setPage(p);
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const retryCurrentPage = () => {
    if (filter === 'All' && !search) {
      setLoadedPages((prev) => {
        const copy = { ...prev };
        delete copy[page];
        return copy;
      });
    } else if (filter !== 'All') {
      setFilteredCache((prev) => {
        const copy = { ...prev };
        delete copy[filter];
        return copy;
      });
    }
  };

  const activeTotalPages = (search && searchResults) || filter !== 'All' ? filteredTotalPages : totalPages;

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
          <h2 className={styles.sectionTitle}>
            {search 
              ? `${allFilteredJobs.length} result${allFilteredJobs.length === 1 ? '' : 's'} for "${search}"`
              : 'Latest Job Openings'
            }
          </h2>
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
          <Spinner size="large" label={search ? 'Searching...' : filter !== 'All' ? `Loading ${filter}...` : `Loading page ${page}…`} />
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
            {search
              ? `No jobs found for "${search}". Try different keywords.`
              : filter !== 'All'
              ? `No ${filter} available right now.`
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