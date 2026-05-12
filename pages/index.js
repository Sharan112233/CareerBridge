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
              {/* Plant pot */}
              <ellipse cx="100" cy="340" rx="35" ry="12" fill="var(--text-soft)" opacity="0.2"/>
              <rect x="70" y="300" width="60" height="40" rx="4" fill="#E8F5E9" stroke="var(--border)" strokeWidth="2"/>
              
              {/* Plant leaves */}
              <path d="M85 300 Q80 280 75 260" stroke="#2E7D32" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <path d="M100 300 Q100 275 100 250" stroke="#2E7D32" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <path d="M115 300 Q120 280 125 260" stroke="#2E7D32" strokeWidth="3" fill="none" strokeLinecap="round"/>
              
              {/* Leaf details */}
              <ellipse cx="75" cy="260" rx="15" ry="25" fill="#4CAF50" opacity="0.8" transform="rotate(-20 75 260)"/>
              <ellipse cx="100" cy="250" rx="15" ry="28" fill="#4CAF50" opacity="0.9"/>
              <ellipse cx="125" cy="260" rx="15" ry="25" fill="#4CAF50" opacity="0.8" transform="rotate(20 125 260)"/>
              
              {/* Browser/Screen */}
              <rect x="180" y="80" width="280" height="200" rx="12" fill="var(--bg-elevated)" stroke="var(--border)" strokeWidth="2"/>
              <rect x="180" y="80" width="280" height="30" rx="12" fill="var(--bg-muted)"/>
              
              {/* Browser buttons */}
              <circle cx="198" cy="95" r="5" fill="#FF5F56"/>
              <circle cx="215" cy="95" r="5" fill="#FFBD2E"/>
              <circle cx="232" cy="95" r="5" fill="#27C93F"/>
              
              {/* Search bar in browser */}
              <rect x="200" y="130" width="240" height="20" rx="10" fill="var(--bg)" stroke="var(--border)" strokeWidth="1"/>
              <circle cx="215" cy="140" r="6" stroke="var(--text-faint)" strokeWidth="2" fill="none"/>
              <line x1="220" y1="145" x2="224" y2="149" stroke="var(--text-faint)" strokeWidth="2"/>
              
              {/* Content lines in browser */}
              <rect x="210" y="170" width="40" height="40" rx="6" fill="var(--bg-muted)"/>
              <rect x="260" y="170" width="160" height="10" rx="5" fill="var(--text-soft)" opacity="0.3"/>
              <rect x="260" y="190" width="120" height="8" rx="4" fill="var(--text-soft)" opacity="0.2"/>
              
              <rect x="210" y="225" width="40" height="40" rx="6" fill="var(--bg-muted)"/>
              <rect x="260" y="225" width="160" height="10" rx="5" fill="var(--text-soft)" opacity="0.3"/>
              <rect x="260" y="245" width="140" height="8" rx="4" fill="var(--text-soft)" opacity="0.2"/>
              
              {/* Chair base shadow */}
              <ellipse cx="380" cy="365" rx="60" ry="12" fill="var(--text-soft)" opacity="0.15"/>
              
              {/* Modern chair */}
              {/* Chair legs */}
              <path d="M340 360 L340 320 M420 360 L420 320" stroke="var(--text)" strokeWidth="3" strokeLinecap="round"/>
              <path d="M335 360 L425 360" stroke="var(--text)" strokeWidth="3" strokeLinecap="round"/>
              
              {/* Chair seat */}
              <ellipse cx="380" cy="320" rx="50" ry="15" fill="#ECEFF1" stroke="var(--text)" strokeWidth="2"/>
              
              {/* Chair back */}
              <path d="M335 320 Q335 280 345 250 L345 200 Q345 180 360 180 L400 180 Q415 180 415 200 L415 250 Q425 280 425 320" 
                    fill="#F5F5F5" stroke="var(--text)" strokeWidth="2"/>
              
              {/* Person sitting - head */}
              <circle cx="380" cy="160" r="24" fill="#FFE0B2" stroke="var(--text)" strokeWidth="2"/>
              
              {/* Hair */}
              <path d="M360 145 Q365 135 380 135 Q395 135 400 145 Q402 155 400 165 L360 165 Q358 155 360 145" 
                    fill="#212121" stroke="var(--text)" strokeWidth="2"/>
              
              {/* Face features */}
              <circle cx="372" cy="160" r="2" fill="var(--text)"/>
              <circle cx="388" cy="160" r="2" fill="var(--text)"/>
              <path d="M375 170 Q380 173 385 170" stroke="var(--text)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              
              {/* Shirt/torso */}
              <path d="M380 184 L380 260" stroke="var(--text)" strokeWidth="3" strokeLinecap="round"/>
              <path d="M355 190 L380 200 L405 190" stroke="var(--text)" strokeWidth="3" fill="none" strokeLinecap="round"/>
              
              {/* Arms */}
              <path d="M380 200 L350 230 Q345 235 345 240" stroke="var(--text)" strokeWidth="3" strokeLinecap="round"/>
              <path d="M380 200 L410 230 Q415 235 415 240" stroke="var(--text)" strokeWidth="3" strokeLinecap="round"/>
              
              {/* Legs */}
              <path d="M380 260 L370 310" stroke="var(--text)" strokeWidth="3" strokeLinecap="round"/>
              <path d="M380 260 L390 310" stroke="var(--text)" strokeWidth="3" strokeLinecap="round"/>
              
              {/* Laptop */}
              <rect x="345" y="235" width="70" height="45" rx="3" fill="#37474F" stroke="var(--text)" strokeWidth="2"/>
              <rect x="350" y="240" width="60" height="35" rx="2" fill="#263238"/>
              
              {/* Laptop screen glow */}
              <rect x="352" y="242" width="56" height="31" rx="1" fill="#4FC3F7" opacity="0.3"/>
              
              {/* Laptop base */}
              <path d="M340 280 L420 280 L425 285 L335 285 Z" fill="#455A64" stroke="var(--text)" strokeWidth="2"/>
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