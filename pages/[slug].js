// pages/[slug].js — Job Detail Page

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DOMPurify from 'isomorphic-dompurify';
import { getAllSlugs, getJobBySlug, getAllJobs } from '../lib/supabase';
import { SITE_NAME, SITE_URL, RESERVED_SLUGS } from '../lib/constants';
import Layout from '../components/Layout';
import Navbar from '../components/Navbar';
import AdBanner from '../components/AdBanner';
import JobCard from '../components/JobCard';
import Footer from '../components/Footer';
import ShareButtons from '../components/ShareButtons';
import RecentlyViewedJobs, { pushRecentlyViewed } from '../components/RecentlyViewedJobs';
import styles from '../styles/JobDetail.module.css';


const INTERVIEW_QUESTIONS = [
  'Tell me about yourself.',
  'What are your strengths and weaknesses?',
  'Why do you want to work here?',
  'What motivates you to perform well at work?',
  'Describe your ideal work environment.',
  'How do you handle criticism or feedback?',
  'What are your salary expectations?',
];

// Keep this in sync with NEW_BADGE_DAYS in components/JobCard.js
const NEW_BADGE_DAYS = 3;

export default function JobDetail({ job, relatedJobs, cleanDescription, jobLd, breadcrumbLd, faqLd, isExpired }) {
  const router = useRouter();
  const [applying, setApplying] = React.useState(false);

  React.useEffect(() => {
    if (!job?.id) return;

    // 1. Track this job in "Recently Viewed" IMMEDIATELY.
    //    This is synchronous, cheap (localStorage), and must run on every
    //    visit — so it goes BEFORE any deferred work.
    pushRecentlyViewed({
      id: job.id,
      slug: job.slug,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      logo_color: job.logo_color,
      category: job.category,
      viewedAt: Date.now(),
    });

    // 2. Defer the view-count API call by 2s so it doesn't compete with
    //    page hydration for the network/CPU budget.
    //    The cleanup function clears the timer if the user navigates away
    //    before it fires — which is fine; missing one view bump is harmless.
    const t = setTimeout(() => {
      fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: job.id }),
      }).catch(() => {});
    }, 2000);

    return () => clearTimeout(t);
  }, [job?.id]);

  if (router.isFallback) {
    return <Layout><div className={styles.loading}>Loading job details...</div></Layout>;
  }

  if (!job) {
    return (
      <Layout>
        <Navbar />
        <div className={styles.notFound}>
          <h1>Job Not Found</h1>
          <p>This job may have been removed or expired.</p>
          <Link href="/" className={styles.backLink}>← Back to Jobs</Link>
        </div>
        <Footer />
      </Layout>
    );
  }

  const handleApply = () => {
    if (isExpired) return;
    setApplying(true);
    setTimeout(() => {
      window.open(job.apply_url, '_blank', 'noopener,noreferrer');
      setApplying(false);
    }, 500);
  };

  // Format both dates the same way for consistency: "26 Apr 2026"
  // (short month, Indian D-M-Y order — matches the audience).
  const formatShortDate = (input) => {
    if (!input) return null;
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // "Listed on" — always present (created_at is always set on a real job)
  const listedOn = formatShortDate(job.created_at);

  // "Last date to apply" — prefer the strict ISO valid_through (Google Jobs
  // schema field), fall back to admin's free-text last_date, fall back to
  // "Not specified" so the row stays balanced with the Listed-on row.
  let lastDateDisplay;
  if (job.valid_through) {
    lastDateDisplay = formatShortDate(job.valid_through) || job.last_date || 'Not specified';
  } else if (job.last_date) {
    lastDateDisplay = job.last_date;
  } else {
    lastDateDisplay = 'Not specified';
  }
  const jobUrl = `${SITE_URL}/${job.slug}`;
  const companySlug = (job.company || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const categorySlug = categoryToSlug(job.category);

  // "NEW" only within NEW_BADGE_DAYS — same rule as JobCard
  const ageDays = job.created_at ? Math.floor((Date.now() - new Date(job.created_at)) / 86400000) : null;
  const showNew = ageDays !== null && ageDays <= NEW_BADGE_DAYS;

  // Big SEO title — admin-editable, falls back to auto-generated
  const bigTitle = job.seo_title || buildBigTitle(job);
  const faqs = buildFaqs(job);

  return (
    <Layout>
      <Head>
        <title>{`${job.title} at ${job.company} – Apply Now | ${SITE_NAME}`}</title>
        <meta name="description" content={`${job.company} is hiring ${job.title}. Location: ${job.location}. Salary: ${job.salary}. Apply now on ${job.company}'s official website.`} />
        <meta property="og:title" content={`${job.title} at ${job.company}`} />
        <meta property="og:description" content={`${job.company} is hiring! ${job.title} – ${job.location} – ${job.salary}`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={jobUrl} />
        <link rel="canonical" href={jobUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      </Head>

      <Navbar />

      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <Link href="/">Home</Link>
        <span>›</span>
        <Link href={`/category/${categorySlug}`}>{categoryLabel(job.category)}</Link>
        <span>›</span>
        <Link href={`/company/${companySlug}`}>{job.company}</Link>
        <span>›</span>
        <span>{job.title}</span>
      </nav>

      {isExpired && (
        <div className={styles.expiredBanner}>
          ⚠️ <strong>This role has closed.</strong> The application deadline has passed. See similar jobs below.
        </div>
      )}

      {/* Big SEO-friendly hero headline */}
      <div className={styles.bigTitleWrap}>
        <h1 className={styles.bigTitle}>{bigTitle}</h1>
      </div>

      <div className={styles.layout}>
        <main className={styles.main}>
          <AdBanner slot="leaderboard" style={{ marginBottom: 20 }} />

          <div className={styles.headerCard}>
            <div className={styles.headerTop}>
              <div className={styles.companyLogo} style={{ background: job.logo_color || '#2563EB' }}>
                {(job.company || 'CO').slice(0, 2).toUpperCase()}
              </div>
              <div className={styles.headerMeta}>
                <div className={styles.companyName}>{job.company}</div>
                <h2 className={styles.jobTitle}>{job.title}</h2>
                <div className={styles.chips}>
                  <span className={styles.chip}>📍 {job.location}</span>
                  <span className={styles.chip}>💼 {job.job_type}</span>
                  <span className={styles.chip}>⏱ {job.experience}</span>
                  <span className={`${styles.chip} ${styles.chipGreen}`}>💰 {job.salary}</span>
                </div>
              </div>
              {isExpired ? (
                <span className={styles.newBadge} style={{ background: 'var(--text-soft)' }}>EXPIRED</span>
              ) : showNew ? (
                <span className={styles.newBadge}>🔥 NEW</span>
              ) : null}
            </div>

            <div className={styles.applySection}>
              <div className={styles.applyMeta}>
                <span>📅 Last date to apply: <strong>{lastDateDisplay}</strong></span>
                {/* View count hidden from public — visible to admins in the dashboard only. */}
                <span>📆 Listed on: {listedOn}</span>
              </div>
              <div className={styles.applyBtns}>
                <button
                  className={`${styles.applyBtn} ${applying ? styles.applying : ''}`}
                  onClick={handleApply}
                  disabled={applying || isExpired}
                  style={isExpired ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                >
                  {isExpired ? '⛔ Applications Closed' : applying ? '⏳ Redirecting...' : `✅ Apply on ${job.company} Website →`}
                </button>
              </div>
              <p className={styles.applyNote}>
                ⚠️ You will be redirected to <strong>{job.company}&apos;s official career page</strong> to submit your application. We do not collect personal data.
              </p>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>About This Role</h2>
            <div className={styles.description} dangerouslySetInnerHTML={{ __html: cleanDescription }} />
          </div>

          {(job.responsibilities?.length > 0 || job.skills?.length > 0) && (
            <div className={styles.twoCol}>
              {job.responsibilities?.length > 0 && (
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>Key Responsibilities</h2>
                  <ul className={styles.list}>
                    {job.responsibilities.map((r, i) => <li key={i}><span className={styles.bullet}>→</span>{r}</li>)}
                  </ul>
                </div>
              )}
              {job.skills?.length > 0 && (
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>Required Skills</h2>
                  <ul className={styles.list}>
                    {job.skills.map((s, i) => <li key={i}><span className={styles.bullet}>✓</span>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {job.eligibility && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Eligibility Criteria</h2>
              <div className={styles.eligibility}>{job.eligibility}</div>
            </div>
          )}

          {/* ───── HOW TO APPLY ───── */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>📌 How to Apply</h2>
            <ol className={styles.howToList}>
              <li>Click on &quot;Apply Now&quot;</li>
              <li>You will be redirected to {job.company} careers page</li>
              <li>Register / Login</li>
              <li>Fill details &amp; submit application</li>
            </ol>
          </div>

          {/* ───── FRAUD WARNING ───── */}
          <div className={styles.fraudNote}>
            <strong>⚠️ Important Note:</strong> We do <strong>NOT</strong> charge any fee for job applications. Beware of fraud calls.
          </div>

          <AdBanner slot="rectangle" style={{ margin: '20px 0' }} />

          {/* ───── BASIC INTERVIEW QUESTIONS ───── */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>🎯 Basic Interview Questions</h2>
            <p style={{ color: 'var(--text-soft)', fontSize: 13, marginBottom: 10 }}>
              Common HR-round questions candidates are typically asked. Prepare honest, concise answers.
            </p>
            <ol className={styles.interviewList}>
              {INTERVIEW_QUESTIONS.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          </div>

          {/* FAQ */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Frequently Asked Questions</h2>
            {faqs.map((f, i) => (
              <div key={i} className={styles.faqItem}>
                <div className={styles.faqQ}>{f.q}</div>
                <div className={styles.faqA}>{f.a}</div>
              </div>
            ))}
          </div>

          {job.tags?.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Job Tags</h2>
              <div className={styles.tagRow}>
                {job.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
              </div>
            </div>
          )}

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Explore More</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href={`/company/${companySlug}`} style={linkPill}>
                → More jobs at {job.company}
              </Link>
              <Link href={`/category/${categorySlug}`} style={linkPill}>
                → More {categoryLabel(job.category)}
              </Link>
              {job.is_fresher && (
                <Link href="/fresher-jobs" style={linkPill}>→ All Fresher Jobs</Link>
              )}
            </div>
          </div>

          {!isExpired && (
            <div className={styles.bottomCta}>
              <div>
                <div className={styles.ctaTitle}>Ready to Apply?</div>
                <div className={styles.ctaSub}>Click below to go to {job.company}&apos;s official hiring page.</div>
              </div>
              <button className={styles.applyBtnLarge} onClick={handleApply}>
                Apply Now on {job.company} →
              </button>
            </div>
          )}

          {/* Recently viewed — exclude current job */}
          <RecentlyViewedJobs excludeId={job.id} />

          {relatedJobs?.length > 0 && (
            <section style={{ marginTop: 40 }}>
              <h2 className={styles.cardTitle} style={{ marginBottom: 16 }}>Similar Jobs You May Like</h2>
              <div className={styles.relatedGrid}>
                {relatedJobs.map((j) => <JobCard key={j.id} job={j} />)}
              </div>
            </section>
          )}
        </main>

        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Quick Info</div>
            {[
              ['Company', job.company],
              ['Role', job.title],
              ['Location', job.location],
              ['Experience', job.experience],
              ['Salary', job.salary],
              ['Job Type', job.job_type],
              ['Last date to apply', lastDateDisplay],
            ].map(([k, v]) => (
              <div key={k} className={styles.sideRow}>
                <span className={styles.sideKey}>{k}</span>
                <span className={styles.sideVal}>{v}</span>
              </div>
            ))}
            {!isExpired && (
              <button className={styles.applyBtn} style={{ width: '100%', marginTop: 16 }} onClick={handleApply}>
                Apply Now →
              </button>
            )}
          </div>

          <AdBanner slot="rectangle" />

          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Share This Job</div>
            <ShareButtons url={jobUrl} title={job.title} company={job.company} location={job.location} salary={job.salary} />
          </div>
        </aside>
      </div>

      <Footer />
    </Layout>
  );
}

const linkPill = {
  display: 'inline-block',
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
  padding: '8px 14px',
  borderRadius: 20,
  fontSize: 13,
  fontWeight: 600,
};

// Build the big SEO title when admin hasn't set one.
// e.g. "Wipro Hiring SW Test Development Engineer | Bangalore | Freshers Eligible | Apply Now"
function buildBigTitle(job) {
  const parts = [`${job.company} Hiring ${job.title}`];
  if (job.location) parts.push(job.location);
  if (job.is_fresher) parts.push('Freshers Eligible');
  parts.push('Apply Now');
  return parts.join(' | ');
}

function categoryToSlug(cat) {
  const map = { IT: 'it-jobs', BPO: 'bpo-jobs', BFSI: 'bfsi-jobs', CORE: 'core-jobs' };
  return map[cat] || 'it-jobs';
}
function categoryLabel(cat) {
  const map = { IT: 'IT Jobs', BPO: 'BPO Jobs', BFSI: 'Banking & Finance Jobs', CORE: 'Core Jobs' };
  return map[cat] || 'Jobs';
}

function buildFaqs(job) {
  return [
    { q: `Is this a real ${job.company} job opening?`, a: `Yes — we only list jobs that link directly to the official ${job.company} career page. If you click "Apply", you'll be taken to ${job.company}'s own website to submit your application. We do not collect resumes or charge any fee.` },
    { q: `How do I apply for this ${job.title} role?`, a: `Click the "Apply on ${job.company} Website" button on this page. You'll be redirected to ${job.company}'s official career portal, where you can submit your application directly.` },
    { q: `What is the salary for ${job.title} at ${job.company}?`, a: `The indicated salary range is ${job.salary || 'as per company standards'}. Final compensation depends on the candidate's skills, experience, and the company's internal bands — confirm on ${job.company}'s official offer letter.` },
    { q: `What is the last date to apply?`, a: `The last date mentioned for this role is ${job.last_date || 'not specified'}. We recommend applying as early as possible since the company may close applications once they receive enough candidates.` },
    { q: `Does ${SITE_NAME} charge any fee?`, a: `No. ${SITE_NAME} is 100% free for job seekers. We never ask for money, documents, or personal details. If anyone claiming to be from the company or from us asks you to pay — it's a scam. Report it.` },
  ];
}

function buildJobPostingLd(job) {
  const ld = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: `<p>${escapeHtml(job.description || '')}</p>`,
    identifier: { '@type': 'PropertyValue', name: job.company, value: job.id },
    datePosted: job.created_at,
    employmentType: (job.job_type || 'FULL_TIME').toUpperCase().replace(/\s+/g, '_'),
    hiringOrganization: { '@type': 'Organization', name: job.company },
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: job.location || '', addressCountry: 'IN' },
    },
    directApply: false,
    url: `${SITE_URL}/${job.slug}`,
  };
  if (job.valid_through) ld.validThrough = new Date(job.valid_through).toISOString();
  const min = Number(job.salary_min), max = Number(job.salary_max);
  if (Number.isFinite(min) && Number.isFinite(max) && min > 0) {
    ld.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: job.salary_currency || 'INR',
      value: { '@type': 'QuantitativeValue', minValue: min, maxValue: max, unitText: 'YEAR' },
    };
  }
  return ld;
}

function buildBreadcrumbLd(job) {
  const companySlug = (job.company || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: categoryLabel(job.category), item: `${SITE_URL}/category/${categoryToSlug(job.category)}` },
      { '@type': 'ListItem', position: 3, name: job.company, item: `${SITE_URL}/company/${companySlug}` },
      { '@type': 'ListItem', position: 4, name: job.title, item: `${SITE_URL}/${job.slug}` },
    ],
  };
}

function buildFaqLd(job, faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

function escapeHtml(s) {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export async function getStaticPaths() {
  const slugs = await getAllSlugs();
  // Filter out anything that would collide with reserved routes
  const safe = slugs.filter((s) => !RESERVED_SLUGS.has(s));
  return { paths: safe.map((slug) => ({ params: { slug } })), fallback: 'blocking' };
}
export async function getStaticProps({ params }) {
  // HARD GUARD: if someone hits a reserved slug, return 404 — don't look it up.
  if (RESERVED_SLUGS.has(params.slug)) {
    return { notFound: true };
  }

   const [job, allJobs] = await Promise.all([getJobBySlug(params.slug), getAllJobs()]);
  if (!job) return { notFound: true };

  const jobTags = Array.isArray(job.tags) ? job.tags : [];
const related = allJobs
  .filter((j) => j.slug !== job.slug && (
    j.company === job.company ||
    (Array.isArray(j.tags) && j.tags.some((t) => jobTags.includes(t)))
  ))
  .slice(0, 3);
  const cleanDescription = DOMPurify.sanitize(
    (job.description || '').replace(/\n/g, '<br/>'),
    { ALLOWED_TAGS: ['br', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'b', 'i'], ALLOWED_ATTR: ['href', 'target', 'rel'] }
  );

  const isExpired = job.valid_through ? new Date(job.valid_through) < new Date() : false;

  const faqs = buildFaqs(job);
  return {
    props: {
      job,
      relatedJobs: related,
      cleanDescription,
      jobLd: buildJobPostingLd(job),
      breadcrumbLd: buildBreadcrumbLd(job),
      faqLd: buildFaqLd(job, faqs),
      isExpired,
    },
    revalidate: 300,
  };
}