// components/CategoryLandingPage.js
// Reusable listing page for /category/*, /company/*, /fresher-jobs, /work-from-home-jobs.
// Uses the same visual system as the home page (Layout + Navbar + JobCard grid + ads + Footer).

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from './Layout';
import Navbar from './Navbar';
import JobCard from './JobCard';
import AdBanner from './AdBanner';
import Footer from './Footer';
import Spinner from './Spinner';
import styles from '../styles/Home.module.css';
import { SITE_NAME, SITE_URL } from '../lib/constants';

export default function CategoryLandingPage({
  title,       // e.g. "IT Jobs"
  heading,     // h1 on page
  description, // short paragraph below h1
  canonicalPath,
  metaDescription,
  jobs,
  breadcrumbs, // array of [label, href|null]
  categoryType, // e.g. "IT Jobs", "BPO Jobs", "Fresher"
}) {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [isChangingPage, setIsChangingPage] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const jobsPerPage = 9;
  const listTopRef = React.useRef(null);

  // Dynamic placeholder based on category
  const searchPlaceholder = categoryType 
    ? `Search ${categoryType.toLowerCase()}...`
    : 'Search company, role, location...';

  // Filter jobs by search query
  const filteredJobs = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    
    return jobs.filter((j) => {
      return (
        (j.title || '').toLowerCase().includes(q) ||
        (j.company || '').toLowerCase().includes(q) ||
        (j.location || '').toLowerCase().includes(q) ||
        (j.tags || []).some((t) => (t || '').toLowerCase().includes(q))
      );
    });
  }, [jobs, search]);

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (page - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const currentJobs = filteredJobs.slice(startIndex, endIndex);

  // Reset to page 1 when search changes with loading state
  React.useEffect(() => {
    const q = search.trim();
    if (q) {
      setIsSearching(true);
      // Simulate search delay for better UX
      const timer = setTimeout(() => {
        setPage(1);
        setIsSearching(false);
        // Scroll to results
        if (listTopRef.current) {
          listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setPage(1);
      setIsSearching(false);
    }
  }, [search]);

  const goToPage = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    setIsChangingPage(true);
    setPage(p);
    
    // Scroll to top
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Clear loading state after animation
    setTimeout(() => setIsChangingPage(false), 300);
  };

  return (
    <Layout>
      <Head>
        <title>{`${title} | ${SITE_NAME}`}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`${title} – ${SITE_NAME}`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${SITE_URL}${canonicalPath}`} />
      </Head>

      <Navbar search={search} onSearch={setSearch} searchPlaceholder={searchPlaceholder} />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            {breadcrumbs && (
              <nav style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-soft)' }}>
                {breadcrumbs.map(([label, href], i) => (
                  <span key={label}>
                    {i > 0 && <span style={{ margin: '0 8px', opacity: 0.5 }}>›</span>}
                    {href ? (
                      <Link href={href} style={{ color: 'var(--text-soft)', textDecoration: 'none' }}>{label}</Link>
                    ) : (
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            <h1 className={styles.heroTitle}>
              {heading}
            </h1>
            <p className={styles.heroSub}>
              {description}
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
                  <span className={styles.statNum}>{jobs.length}+</span>
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
                  <span className={styles.statNum}>Top</span>
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
        <div ref={listTopRef} className={styles.sectionTop}>
          <h2 className={styles.sectionTitle}>
            {search 
              ? `${filteredJobs.length} result${filteredJobs.length === 1 ? '' : 's'} for "${search}"`
              : `${filteredJobs.length} job${filteredJobs.length === 1 ? '' : 's'} found`
            }
          </h2>
        </div>

        {isSearching || isChangingPage ? (
          <Spinner size="large" label={isSearching ? 'Searching...' : `Loading page ${page}…`} />
        ) : filteredJobs.length === 0 ? (
          <div className={styles.empty}>
            {search ? `No jobs found for "${search}". Try different keywords.` : 'No jobs in this category right now. Check back soon!'}
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {currentJobs.slice(0, 3).map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
            {currentJobs.length > 3 && (
              <div className={styles.adMid}><AdBanner slot="large" /></div>
            )}
            <div className={styles.grid}>
              {currentJobs.slice(3).map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className={styles.pagination} aria-label="Pagination">
                <button
                  className={styles.pageBtn}
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1 || isChangingPage}
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
                        disabled={isChangingPage}
                        aria-current={p === page ? 'page' : undefined}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  className={styles.pageBtn}
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages || isChangingPage}
                >
                  Next →
                </button>
              </nav>
            )}

            <div className={styles.pageStatus} aria-live="polite">
              {isChangingPage
                ? `Loading page ${page}…`
                : `Page ${page} of ${totalPages} · Showing ${currentJobs.length} jobs`}
            </div>
          </>
        )}

        <div className={styles.adBottom}><AdBanner slot="rectangle" /></div>
      </main>

      <Footer />
    </Layout>
  );
}