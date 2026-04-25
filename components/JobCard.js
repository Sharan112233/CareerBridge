// components/JobCard.js
import React from 'react';
import Link from 'next/link';
import styles from '../styles/JobCard.module.css';

const COMPANY_COLORS = {
  Wipro:'#1a73e8', Infosys:'#007DC1', TCS:'#003087',
  Accenture:'#A100FF', HCL:'#0076C0', Cognizant:'#1DA462',
  Amazon:'#FF9900', Google:'#4285F4', Microsoft:'#00A4EF',
  Capgemini:'#0070AD',
};

// "NEW" badge only shown for jobs posted within this many days.
const NEW_BADGE_DAYS = 3;

// Plain functions — no hooks, no state. Runs once per render.
function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (Number.isNaN(diff)) return null;
  return diff;
}

function daysAgoLabel(dateStr) {
  const diff = daysSince(dateStr);
  if (diff === null) return '';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff} days ago`;
}

function JobCard({ job }) {
  if (!job || !job.slug) return null;

  const company = job.company || 'Company';
  const initials = company.split(' ').map((w) => w[0] || '').join('').slice(0, 2).toUpperCase() || 'CO';
  const bg = COMPANY_COLORS[company] || job.logo_color || '#2563EB';

  const ageDays = daysSince(job.created_at);
  const isNew = ageDays !== null && ageDays <= NEW_BADGE_DAYS;

  return (
    <Link href={`/${job.slug}`} className={styles.card}>
      <div className={styles.top}>
        <div className={styles.logo} style={{ background: bg }}>
          <span className={styles.logoText}>{initials}</span>
        </div>
        <div className={styles.meta}>
          <div className={styles.company}>{company}</div>
          <div className={styles.title}>{job.title || ''}</div>
        </div>
        {isNew && <span className={styles.newBadge}>NEW</span>}
      </div>

      <div className={styles.info}>
        {job.location && (
          <span className={styles.infoItem}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {job.location}
          </span>
        )}
        {job.job_type && (
          <span className={styles.infoItem}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
            </svg>
            {job.job_type}
          </span>
        )}
        {job.experience && (
          <span className={styles.infoItem}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {job.experience}
          </span>
        )}
      </div>

      {job.salary && <div className={styles.salary}>{job.salary}</div>}

      {Array.isArray(job.tags) && job.tags.length > 0 && (
        <div className={styles.tags}>
          {job.tags.slice(0, 3).map((t) => (
            <span key={t} className={styles.tag}>{t}</span>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.posted}>🕐 {daysAgoLabel(job.created_at)}</span>
        <span className={styles.viewBtn}>View & Apply →</span>
      </div>
    </Link>
  );
}

// React.memo skips re-render when props (job) are shallow-equal.
// Typing in the search box on the home page re-renders the parent,
// which previously caused every visible JobCard to re-run its function
// even though its `job` prop was identical. This fixes that.
//
// Custom comparator: we only care if the job id changed — all other
// job fields are stable while on the same listing page.
export default React.memo(JobCard, (prev, next) => {
  return prev.job?.id === next.job?.id;
});