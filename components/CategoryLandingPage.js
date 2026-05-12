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