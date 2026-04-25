// pages/index.js — Home page (ISR, SERVER-paginated, filter-persistent)
//
// Only 9 jobs ship in the initial HTML. Pages 2+ are fetched via /api/jobs
// when the user clicks Next. Search + filter still run on the currently
// loaded pages for instant response (no round-trip lag).

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
import styles from '../styles/Home.module.css';

// Recently-viewed is localStorage-backed and not in the first paint.
// ssr:false means it won't render until after hydration on the client —
// zero cost to initial HTML/JS, and no hydration mismatch.
const RecentlyViewedJobs = dynamic(
  () => import('../components/RecentlyViewedJobs'),
  { ssr: false, loading: () => null }
);

const PAGE_SIZE = 9;

export default function Home({ initialJobs, totalJobs }) {
  const router = useRouter();

  // Server-delivered page 1 is always in state. Pages 2+ get appended as
  // the user clicks Next. We keep every loaded page in `loadedPages` so
  // clicking Prev back to page 1 is instant (no refetch).
  const [filter, setFilter] = React.useState('All');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [loadedPages, setLoadedPages] = React.useState({ 1: initialJobs });
  const [fetchingPage, setFetchingPage] = React.useState(null);
  const [hydrated, setHydrated] = React.useState(false);

  const listTopRef = React.useRef(null);

  const totalPages = Math.max(1, Math.ceil(totalJobs / PAGE_SIZE));

  // Hydrate filter/search/page from URL + localStorage
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

  // Persist filter only (not search)
  React.useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem('cb_filter', filter); } catch {}
  }, [filter, hydrated]);

  // When the user navigates to a page we haven't loaded yet, fetch it.
  React.useEffect(() => {
    if (!hydrated) return;
    if (loadedPages[page]) return;
    if (fetchingPage === page) return;

    let cancelled = false;
    setFetchingPage(page);

    fetch(`/api/jobs?page=${page}&pageSize=${PAGE_SIZE}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => {
        if (cancelled) return;
        setLoadedPages((prev) => ({ ...prev, [page]: data.jobs || [] }));
      })
      .catch(() => {
        if (cancelled) return;
        // On error, store empty so we stop trying and show the empty state
        setLoadedPages((prev) => ({ ...prev, [page]: [] }));
      })
      .finally(() => {
        if (!cancelled) setFetchingPage(null);
      });

    return () => { cancelled = true; };
  }, [page, loadedPages, fetchingPage, hydrated]);

  // The jobs currently rendered = whatever page we're on, filtered client-side
  // (instant — no extra network).
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
        filter === 'All'       ? true :
        filter === 'IT Jobs'   ? j.category === 'IT' :
        filter === 'BPO Jobs'  ? j.category === 'BPO' :
        filter === 'Fresher'   ? Boolean(j.is_fresher) : true;
      return matchSearch && matchFilter;
    });
  }, [currentPageJobs, search, filter]);

  // Reset to page 1 on filter/search change so the user sees matching results.
  // Without this, a user on page 3 who types a search that has no matches on
  // page 3 would see "no jobs" and get confused.
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

  const isLoadingPage = fetchingPage === page && !loadedPages[page];

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
          <span className={styles.heroTag}>🔥 Updated Daily</span>
          <h1 className={styles.heroTitle}>
            Find Your Dream Job<br />
            <span className={styles.heroAccent}>from Top Companies</span>
          </h1>
          <p className={styles.heroSub}>
            We curate the latest openings from Wipro, Infosys, TCS, Accenture & more.<br />
            One click → Official Company Application Page.
          </p>
          <div className={styles.heroStats}>
            {[['150+','Active Jobs'],['50+','Companies'],['10K+','Monthly Visitors'],['Daily','Updates']].map(([n,l]) => (
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
        {/* Dynamically imported, no SSR — zero initial-load cost */}
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

        {isLoadingPage ? (
          <div className={styles.empty}>Loading page {page}…</div>
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
              disabled={page === 1 || fetchingPage !== null}
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
                    disabled={fetchingPage !== null}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
            <button
              className={styles.pageBtn}
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages || fetchingPage !== null}
            >
              Next →
            </button>
          </nav>
        )}

        <div className={styles.pageStatus} aria-live="polite">
          {isLoadingPage
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
    const { jobs, total } = await getJobsPaginated(1, PAGE_SIZE);
    return {
      props: {
        initialJobs: jobs,
        totalJobs: total,
      },
      revalidate: 60,
    };
  } catch (err) {
    return {
      props: { initialJobs: [], totalJobs: 0 },
      revalidate: 30,
    };
  }
}