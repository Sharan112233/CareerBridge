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
}) {
  const [visible, setVisible] = React.useState(9);

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

      <Navbar />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            {breadcrumbs && (
              <nav style={{ marginBottom: '16px', fontSize: '13px', color: '#6B7280' }}>
                {breadcrumbs.map(([label, href], i) => (
                  <span key={label}>
                    {i > 0 && <span style={{ margin: '0 8px', opacity: 0.5 }}>›</span>}
                    {href ? (
                      <Link href={href} style={{ color: '#6B7280', textDecoration: 'none' }}>{label}</Link>
                    ) : (
                      <span style={{ fontWeight: 600, color: '#111827' }}>{label}</span>
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
              {/* Browser Window */}
              <rect x="50" y="40" width="280" height="200" rx="12" fill="#fff" stroke="#E5E7EB" strokeWidth="2"/>
              <rect x="50" y="40" width="280" height="30" rx="12" fill="#F3F4F6"/>
              <circle cx="68" cy="55" r="4" fill="#DC2626"/>
              <circle cx="82" cy="55" r="4" fill="#FBBF24"/>
              <circle cx="96" cy="55" r="4" fill="#16A34A"/>
              {/* Browser content */}
              <circle cx="90" cy="100" r="8" fill="#E5E7EB"/>
              <rect x="110" y="92" width="180" height="8" rx="4" fill="#E5E7EB"/>
              <rect x="110" y="105" width="120" height="6" rx="3" fill="#F3F4F6"/>
              <circle cx="90" cy="140" r="8" fill="#E5E7EB"/>
              <rect x="110" y="132" width="180" height="8" rx="4" fill="#E5E7EB"/>
              <rect x="110" y="145" width="140" height="6" rx="3" fill="#F3F4F6"/>
              <circle cx="90" cy="180" r="8" fill="#E5E7EB"/>
              <rect x="110" y="172" width="180" height="8" rx="4" fill="#E5E7EB"/>
              <rect x="110" y="185" width="100" height="6" rx="3" fill="#F3F4F6"/>
              {/* Person sitting */}
              <ellipse cx="400" cy="360" rx="60" ry="12" fill="#E5E7EB"/>
              {/* Chair */}
              <path d="M350 280 L350 360 M370 280 L370 360 M340 360 L380 360 M340 280 L380 280 Q390 260 390 240 L390 200 M340 200 L390 200" stroke="#111827" strokeWidth="3" fill="none"/>
              {/* Person body */}
              <circle cx="380" cy="160" r="22" fill="#FEE2E2" stroke="#111827" strokeWidth="2"/>
              <path d="M380 182 L380 250" stroke="#111827" strokeWidth="3"/>
              <path d="M380 200 L350 230" stroke="#111827" strokeWidth="3"/>
              <path d="M380 200 L410 220" stroke="#111827" strokeWidth="3"/>
              <path d="M380 250 L360 300" stroke="#111827" strokeWidth="3"/>
              <path d="M380 250 L400 300" stroke="#111827" strokeWidth="3"/>
              {/* Laptop */}
              <rect x="370" y="215" width="60" height="40" rx="2" fill="#1F2937" stroke="#111827" strokeWidth="2"/>
              <rect x="365" y="255" width="70" height="3" fill="#374151"/>
              {/* Plant */}
              <ellipse cx="120" cy="300" rx="20" ry="8" fill="#6B7280"/>
              <path d="M120 300 L120 270 M115 280 Q110 275 108 270 M125 280 Q130 275 132 270 M115 285 Q108 282 105 278 M125 285 Q132 282 135 278" stroke="#16A34A" strokeWidth="2" fill="none"/>
            </svg>
          </div>
        </div>
      </section>

















      <div className={styles.adWrap}>
        <AdBanner slot="leaderboard" />
      </div>

      <main className={styles.main}>
        <div className={styles.sectionTop}>
          <h2 className={styles.sectionTitle}>{jobs.length} job{jobs.length === 1 ? '' : 's'} found</h2>
        </div>

        {jobs.length === 0 ? (
          <div className={styles.empty}>No jobs in this category right now. Check back soon!</div>
        ) : (
          <>
            <div className={styles.grid}>
              {jobs.slice(0, Math.min(3, visible)).map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
            {visible >= 3 && (
              <div className={styles.adMid}><AdBanner slot="large" /></div>
            )}
            <div className={styles.grid}>
              {jobs.slice(3, visible).map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
            {visible < jobs.length && (
              <div className={styles.loadMoreWrap}>
                <button className={styles.loadMoreBtn} onClick={() => setVisible((v) => v + 6)}>
                  Load More ({jobs.length - visible} remaining)
                </button>
              </div>
            )}
          </>
        )}

        <div className={styles.adBottom}><AdBanner slot="rectangle" /></div>
      </main>

      <Footer />
    </Layout>
  );
}