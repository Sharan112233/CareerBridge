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

      {/* Hero (same style as home, just smaller) */}
      <section className={styles.hero} style={{ padding: '44px 20px 36px' }}>
        <div className={styles.heroInner}>
          {breadcrumbs && (
            <nav aria-label="breadcrumb" style={{ marginBottom: 10, fontSize: 13, color: '#BFDBFE' }}>
              {breadcrumbs.map(([label, href], i) => (
                <span key={label}>
                  {i > 0 && <span style={{ margin: '0 6px' }}>›</span>}
                  {href ? (
                    <Link href={href} style={{ color: '#BFDBFE', textDecoration: 'underline' }}>{label}</Link>
                  ) : (
                    <span style={{ color: '#fff' }}>{label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className={styles.heroTitle} style={{ fontSize: 'clamp(22px, 4vw, 36px)' }}>{heading}</h1>
          <p className={styles.heroSub} style={{ fontSize: 14 }}>{description}</p>
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
