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

  // Render-only flag: just used to show/hide the spinner.
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState(null);

  const [hydrated, setHydrated] = React.useState(false);
  const listTopRef = React.useRef(null);

  // Track which page is currently being fetched in a REF — refs don't cause
  // re-renders, so the effect doesn't see itself update.
  const inFlightPageRef = React.useRef(null);

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

  // Fetch missing pages on demand.
  // CRITICAL: this effect's deps DON'T include the in-flight tracker.
  // It only re-runs when `page` or `loadedPages[page]` changes.
  React.useEffect(() => {
    if (!hydrated) return;
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
  }, [page, loadedPages, hydrated]);

  const currentPageJobs = loadedPages[page] || [];

  const filteredJobs = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q && filter === 'All') return currentPageJobs;
    return currentPageJobs.filter((j) => {
      const matchSearch =
        !q ||
        (j.title || '').toLowerCase().includes(q) ||
        (j.company || '').toLowerCase().includes(q) ||
        (j.location || '').toLowerCase().includes(q) ||
        (j.tags || []).some((t) => (t || '').toLowerCase().includes(q));
      const matchFilter =
        filter === 'All'      ? true :
        filter === 'IT Jobs'  ? j.category === 'IT' :
        filter === 'BPO Jobs' ? j.category === 'BPO' :
        filter === 'Fresher'  ? Boolean(j.is_fresher) : true;
      return matchSearch && matchFilter;
    });
  }, [currentPageJobs, search, filter]);

  React.useEffect(() => {
    if (!hydrated) return;
    setPage(1);
  }, [filter, search, hydrated]);

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const retryCurrentPage = () => {
    // Clear error and force the effect to re-run by removing this page from cache
    setLoadError(null);
    setLoadedPages((prev) => {
      const next = { ...prev };
      delete next[page];
      return next;
    });
    inFlightPageRef.current = null;
  };

  return (
    <Layout>
      <Head>
        <title>{`${SITE_NAME} – Latest Job Openings 2026 | IT, BPO, Fresher Jobs`}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta property="og:title" content={`${SITE_NAME} – Latest Job Openings`} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <link rel="canonical" href={SITE_URL} />
      </Head>

      <Navbar search={search} onSearch={setSearch} />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            Find Your Dream Job<br />
            <span className={styles.heroAccent}>from Top Companies</span>
          </h1>
          <p className={styles.heroSub}>
            We curate the latest openings from Wipro, Infosys, TCS, Accenture & more.<br />
            One click → Official Company Application Page.
          </p>
          <div className={styles.heroStats}>
            {[
              [String(totalJobs ?? 0)+"+", 'Active Jobs '],
              [String(companyCount ?? 0)+"+",'Companies'],
              ['Daily', 'Updates'],
            ].map(([n, l]) => (
              <div key={l} className={styles.stat}>
                <span className={styles.statNum}>{n}</span>
                <span className={styles.statLabel}>{l}</span>
              </div>
            ))}
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
          <Spinner size="large" label={`Loading page ${page}…`} />
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
        ) : filteredJobs.length === 0 ? (
          <div className={styles.empty}>
            {search || filter !== 'All'
              ? 'No jobs match your filters on this page. Try Prev/Next or clear filters.'
              : 'No jobs found.'}
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {filteredJobs.slice(0, 3).map((j) => <JobCard key={j.id} job={j} />)}
            </div>
            <div className={styles.adMid}><AdBanner slot="large" /></div>
            <div className={styles.grid}>
              {filteredJobs.slice(3).map((j) => <JobCard key={j.id} job={j} />)}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <nav className={styles.pagination} aria-label="Pagination">
            <button
              className={styles.pageBtn}
              onClick={() => goToPage(page - 1)}
              disabled={page === 1 || isLoading}
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: 'var(--text-faint)' }}>…</span>}
                  <button
                    className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                    onClick={() => goToPage(p)}
                    disabled={isLoading}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
            <button
              className={styles.pageBtn}
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages || isLoading}
            >
              Next →
            </button>
          </nav>
        )}

        <div className={styles.pageStatus} aria-live="polite">
          {isLoading
            ? `Loading page ${page}…`
            : `Page ${page} of ${totalPages} · Showing ${filteredJobs.length} jobs`}
        </div>

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