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
            <svg width="400" height="280" viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Plant pot - left side */}
              <ellipse cx="40" cy="250" rx="18" ry="5" fill="#e0e0e0"/>
              <rect x="24" y="230" width="32" height="20" rx="2" fill="white" stroke="#333" strokeWidth="1.5"/>
              
              {/* Plant leaves - 3 leaves */}
              <path d="M30 230 Q28 220 26 210" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <ellipse cx="24" cy="208" rx="6" ry="10" fill="#333" transform="rotate(-15 24 208)"/>
              
              <path d="M40 230 Q40 218 40 206" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <ellipse cx="40" cy="200" rx="6" ry="12" fill="#333"/>
              
              <path d="M50 230 Q52 220 54 210" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <ellipse cx="56" cy="208" rx="6" ry="10" fill="#333" transform="rotate(15 56 208)"/>
              
              {/* Browser window */}
              <rect x="70" y="40" width="140" height="120" rx="8" fill="white" stroke="#d0d0d0" strokeWidth="1.5"/>
              
              {/* Browser top bar */}
              <rect x="70" y="40" width="140" height="20" rx="8" fill="#f5f5f5"/>
              <rect x="70" y="52" width="140" height="8" fill="#f5f5f5"/>
              
              {/* Browser dots */}
              <circle cx="80" cy="50" r="2.5" fill="#d0d0d0"/>
              <circle cx="90" cy="50" r="2.5" fill="#d0d0d0"/>
              <circle cx="100" cy="50" r="2.5" fill="#d0d0d0"/>
              
              {/* Menu icon - right side */}
              <line x1="190" y1="48" x2="200" y2="48" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="190" y1="52" x2="200" y2="52" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
              
              {/* Search bar */}
              <rect x="80" y="70" width="120" height="16" rx="8" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
              <circle cx="90" cy="78" r="4" stroke="#999" strokeWidth="1.2" fill="none"/>
              <line x1="93" y1="81" x2="96" y2="84" stroke="#999" strokeWidth="1.2" strokeLinecap="round"/>
              
              {/* Content items */}
              <rect x="80" y="95" width="20" height="20" rx="3" fill="#f0f0f0"/>
              <rect x="105" y="98" width="80" height="4" rx="2" fill="#e8e8e8"/>
              <rect x="105" y="106" width="60" height="3" rx="1.5" fill="#f0f0f0"/>
              
              <rect x="80" y="125" width="20" height="20" rx="3" fill="#f0f0f0"/>
              <rect x="105" y="128" width="80" height="4" rx="2" fill="#e8e8e8"/>
              <rect x="105" y="136" width="70" height="3" rx="1.5" fill="#f0f0f0"/>
              
              {/* Person sitting */}
              {/* Head */}
              <circle cx="300" cy="65" r="16" fill="white" stroke="#333" strokeWidth="1.5"/>
              
              {/* Hair */}
              <path d="M287 60 Q288 52 300 50 Q312 52 313 60 Q314 65 312 70 L288 70 Q286 65 287 60" 
                    fill="#333" stroke="#333" strokeWidth="1.5"/>
              
              {/* Face features */}
              <circle cx="295" cy="65" r="1.5" fill="#333"/>
              <circle cx="305" cy="65" r="1.5" fill="#333"/>
              <path d="M296 72 Q300 74 304 72" stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round"/>
              
              {/* Neck and shirt collar */}
              <path d="M300 81 L300 95" stroke="#333" strokeWidth="1.5"/>
              <path d="M292 84 Q300 88 308 84" stroke="#333" strokeWidth="1.5" fill="none"/>
              
              {/* Shirt/body */}
              <path d="M285 90 L285 150 Q285 155 290 155 L310 155 Q315 155 315 150 L315 90" 
                    fill="white" stroke="#333" strokeWidth="1.5"/>
              
              {/* Left arm */}
              <path d="M285 95 Q270 105 265 115 L260 125" stroke="#333" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <path d="M258 123 Q256 128 256 133" stroke="#333" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              
              {/* Right arm */}
              <path d="M315 95 Q330 105 335 115 L340 125" stroke="#333" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <path d="M342 123 Q344 128 344 133" stroke="#333" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              
              {/* Laptop */}
              <rect x="270" y="125" width="60" height="35" rx="2" fill="white" stroke="#333" strokeWidth="1.5"/>
              <rect x="273" y="128" width="54" height="29" rx="1" fill="#f5f5f5"/>
              
              {/* Laptop base */}
              <path d="M265 160 L335 160 L338 163 L262 163 Z" fill="white" stroke="#333" strokeWidth="1.5"/>
              
              {/* Laptop screen details */}
              <circle cx="283" cy="140" r="2" fill="#333"/>
              <rect x="290" y="137" width="30" height="2" rx="1" fill="#e0e0e0"/>
              <rect x="290" y="143" width="25" height="2" rx="1" fill="#e0e0e0"/>
              <rect x="290" y="149" width="28" height="2" rx="1" fill="#e0e0e0"/>
              
              {/* Pants/legs */}
              <path d="M290 155 L285 200 L283 230" stroke="#333" strokeWidth="8" strokeLinecap="round"/>
              <path d="M310 155 L315 200 L317 230" stroke="#333" strokeWidth="8" strokeLinecap="round"/>
              
              {/* Shoes */}
              <ellipse cx="282" cy="235" rx="10" ry="5" fill="#333"/>
              <ellipse cx="318" cy="235" rx="10" ry="5" fill="#333"/>
              <rect x="272" y="230" width="12" height="8" rx="2" fill="#333"/>
              <rect x="308" y="230" width="12" height="8" rx="2" fill="#333"/>
              
              {/* Chair */}
              {/* Chair seat */}
              <ellipse cx="300" cy="165" rx="35" ry="10" fill="white" stroke="#d0d0d0" strokeWidth="1.5"/>
              
              {/* Chair back */}
              <path d="M270 165 Q268 140 272 120 L272 90 Q272 80 280 80 L320 80 Q328 80 328 90 L328 120 Q332 140 330 165" 
                    fill="white" stroke="#d0d0d0" strokeWidth="1.5"/>
              
              {/* Chair legs */}
              <path d="M275 240 L275 170" stroke="#d0d0d0" strokeWidth="1.5"/>
              <path d="M325 240 L325 170" stroke="#d0d0d0" strokeWidth="1.5"/>
              <path d="M270 240 L330 240" stroke="#d0d0d0" strokeWidth="1.5"/>
              
              {/* Chair base shadow */}
              <ellipse cx="300" cy="242" rx="40" ry="6" fill="#f0f0f0" opacity="0.5"/>
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